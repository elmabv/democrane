const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
const mqttbroker = "aliconnect.nl";
const mqttport = location.protocol === 'https:' ? 1884 : 1338;
const stockpos = [];
Web.on('loaded', async event => {
  const {config} = Aim;
  await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);
  await Aim.fetch('https://elmabv.aliconnect.nl/elmabv/elmabv.github.io/pwms/crane/config').get().then(config);

  await Web.require('https://aliconnect.nl/sdk/dist/js/three/three.js');
  await Web.require('https://aliconnect.nl/sdk/dist/js/three/OrbitControls.js');
  let camera, scene, renderer;
  let mesh;
  const size = 30000;
  const containers = [];
  const indexpos = [];

  THREE.Mesh.prototype.setPosition = function(x,y,z){
    // console.log(this, this.geometry.parameters);
    this.position.x = -size/2+x+this.geometry.parameters.width/2;
    this.position.z = size/2-z-this.geometry.parameters.depth/2;
    this.position.y = y+this.geometry.parameters.height/2;
    this.material.opacity = 0.1;
    // this.up.y=0;
    return this;
  }
  THREE.Mesh.prototype.pos = function(x,y,z){
    // console.log(this, this.geometry.parameters);
    this.position.set(x,y,z);
    return this;
  }

  init();
  animate();

  function init() {
    scene = new THREE.Scene();
    holder = new THREE.Group();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    var floorMaterial = new THREE.MeshBasicMaterial({ color: 0x999999 });
    window.addEventListener( 'resize', onWindowResize );
    scene.add( holder );
    holder.position.y = -200;
    function hsl(h, s, l) {
      return (new THREE.Color()).setHSL(h, s, l);
    }
    function box(width, height, depth, material = {color: 0x888888}){
      return new THREE.Mesh(
        new THREE.BoxGeometry( width, height, depth ),
        new THREE.MeshPhongMaterial (material),
        // new THREE.MeshBasicMaterial ({ color: 0xffffff, envMap: textureCube}),
      )
    }
    const wandHoogte = 5000;
    const wandDikte = 300;
    const wallmat = {
      color: 0x888888,
      opacity: 0,
      transparent: true,
    }
    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
    light.position.set(0, 5000, 5000);
    holder.add(light);
    var light = new THREE.DirectionalLight(0xFFFFFF, 1);
    var light = new THREE.PointLight(0xffffff, 0.8, 0, 1000);
    light.position.set(0,5000,-5000);
    holder.add(light);

    const [depth,width,height] = [6060,2430,2590];
    // const [depth,width,height] = [6100,2500,2600];

    var [maxY,maxZ,maxX] = [5,5,50];
    var [maxY,maxZ,maxX] = [3,3,10];
    for (var posy = 20, y = 0; y<=maxY+1; y++, posy += height) {
      indexpos[y] = [];
      for (var posz = 4000,z = 0; z<=maxZ; z++, posz += depth+200) {
        indexpos[y][z] = [];
        for (var posx = 500, x = 0; x<=maxX; x++, posx += width+200) {
          stockpos.push(indexpos[y][z][x] = {x,y,z,posx,posy,posz,depth,width,height,type:1});
        }
      }
    }
    console.log({posx,posy,posz});

    var floorGeometry = new THREE.PlaneGeometry(posx, posz, 0, 0);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    holder.add(floor);

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, posx*2 );
    camera.position.z = posz/2;
    camera.position.y = posx/2;

    holder.add(
      box(wandDikte,wandHoogte,26000).setPosition(0, 0, 4000),
      box(wandDikte,wandHoogte,26000).setPosition(posx-wandDikte, 0, 4000),
      box(posx,wandHoogte,wandDikte).setPosition(0, 0, posx),
      // box(30000,1000,wandDikte).setPosition(0, 0, 12000),

      // box(100,2500,6000,wallmat).setPosition(30000 - 5000, 0, 12000),
      // box(5000,2500,100,wallmat).setPosition(30000 - 5000, 0, 12000 + 6000),
      // box(5000,100,6000,wallmat).setPosition(30000 - 5000, 2500, 12000),
    );

    let busy = false;
    const speed = 100;
    async function go(){
      // console.log('GO',busy);
      if (busy) return;
      const container = containers.filter(container => container instanceof Container).find(container => !container.put || container.get==1);
      if (container) {
        const freespot = container.get ? indexpos.flat(3).filter(pos => pos.z==0 && pos.y==0).find(pos => !pos.container) : indexpos.flat(3).filter(pos => pos.z>0 && pos.y<=maxY-1).find(pos => !pos.container);
        // console.log('READY', {container, freespot});
        if (freespot) {
          freespot.container = container;
          container.put = true;
          container.get++;
          busy = true;
          const {y,z,x} = freespot;
          await gripper.moveto([maxY+1,gripper.targetz,gripper.targetx]);
          await gripper.moveto([maxY+1,container.targetz,container.targetx]);
          await gripper.moveto([container.targety+1,container.targetz,container.targetx]);
          gripper.moveto([maxY+1,container.targetz,container.targetx]);
          await container.moveto([maxY,container.targetz,container.targetx]);
          delete container.spot.container;
          delete container.spot;

          gripper.moveto([maxY+1,container.targetz = z,container.targetx = x]);
          await container.moveto([maxY,container.targetz = z,container.targetx = x]);
          gripper.moveto([y+1,z,x]);
          await container.moveto([y,z,x]);
          container.spot = freespot;
          if (container.get) {
            // console.log(container, container.material);
            // container.mesh.material.color.set('green');

            setTimeout(event => {
              holder.remove(container.mesh);
              delete container.spot.container;
              delete container.spot;

            }, 5000);
          }
          go(busy = false);
        }
      }
    }
    const loader = new THREE.TextureLoader().setPath( 'assets/image/' );
    // var texture = loader.load( 'crate.gif' );
    const material = this.material = [
      new THREE.MeshBasicMaterial({ map: loader.load('container-side.png') }), //right side
      new THREE.MeshBasicMaterial({ map: loader.load('container-side.png')}), //left side
      new THREE.MeshBasicMaterial({ map: loader.load('container-top.png')}), //top side
      new THREE.MeshBasicMaterial({ map: loader.load('container-top.png')}), //bottom side
      new THREE.MeshBasicMaterial({ map: loader.load('container-front.png')}), //front side
      new THREE.MeshBasicMaterial({ map: loader.load('container-back.png')}), //back side
    ];

    function Container(newpos) {
      const freespot = indexpos.flat(3).filter(pos => pos.z==0 && pos.y==0).find(pos => !pos.container);
      if (!freespot) return;
      const {y,z,x} = freespot;
      this.spot = freespot;
      freespot.container = this;
      this.targetx = x;
      this.targety = y;
      this.targetz = z;
      const targetpos = indexpos[y][z][x];
      let {width,height,depth,posx,posy,posz} = targetpos;
      const geo = new THREE.BoxGeometry(width,height,depth);

      // const material = this.material = new THREE.MeshBasicMaterial ({ color: 0xffffff, envMap: texture1});

      const mesh = this.mesh = new THREE.Mesh(geo,material);
      holder.add(mesh);
      containers.push(this);
      function setpos(set) {
        const px = posx + -size/2 + geo.parameters.width/2;
        const pz = -posz + size/2 - geo.parameters.depth/2;
        const py = posy + geo.parameters.height/2;
        mesh.position.set(px,py,pz);
      }
      setpos(true);
      this.moveto = function(newpos) {
        return new Promise((success,fail) => {
          this.movedone = success;
          Object.assign(this,{newpos});
        })
      }
      this.move = function() {
        const {newpos} = this;
        if (newpos) {
          const [y,z,x] = newpos;
          const targetpos = indexpos[y][z][x];
          if (posx != targetpos.posx) {
            posx += Math.max(-speed,Math.min(targetpos.posx-posx,speed));
          } else {
            this.targetx = x;
          }
          if (posy != targetpos.posy) {
            posy += Math.max(-speed,Math.min(targetpos.posy-posy,speed));
          } else {
            this.targety = y;
          }
          if (posz != targetpos.posz) {
            posz += Math.max(-speed,Math.min(targetpos.posz-posz,speed));
          } else {
            this.targetz = z;
          }
          if (this.movedone && targetpos.posx==posx && targetpos.posy==posy && targetpos.posz==posz) {
            this.movedone();
            delete this.movedone;
          } else {
            setpos();
          }
        }
      }
      go();
    }
    function Gripper(newpos) {
      const [y,z,x] = newpos;
      this.targetx = x;
      this.targety = y;
      this.targetz = z;
      const targetpos = indexpos[y][z][x];
      let {width,height,depth,posx,posy,posz} = targetpos;
      const geo = new THREE.BoxGeometry(width,300,depth);
      const material = new THREE.MeshPhongMaterial ({color: 'yellow'});
      const mesh = this.mesh = new THREE.Mesh(geo,material);
      holder.add(mesh);
      containers.push(this);
      function setpos(set) {
        const px = posx + -size/2 + geo.parameters.width/2;
        const pz = -posz + size/2 - geo.parameters.depth/2;
        const py = posy + geo.parameters.height/2;
        mesh.position.set(px,py,pz);
      }
      setpos(true);
      this.moveto = function(newpos) {
        return new Promise((success,fail) => {
          this.movedone = success;
          Object.assign(this,{newpos});
        })
      }
      this.move = function() {
        const {newpos} = this;
        if (newpos) {
          const [y,z,x] = newpos;
          const targetpos = indexpos[y][z][x];
          if (posx != targetpos.posx) {
            posx += Math.max(-speed,Math.min(targetpos.posx-posx,speed));
          } else {
            this.targetx = x;
          }
          if (posy != targetpos.posy) {
            posy += Math.max(-speed,Math.min(targetpos.posy-posy,speed));
          } else {
            this.targety = y;
          }
          if (posz != targetpos.posz) {
            posz += Math.max(-speed,Math.min(targetpos.posz-posz,speed));
          } else {
            this.targetz = z;
          }
          if (this.movedone && targetpos.posx==posx && targetpos.posy==posy && targetpos.posz==posz) {
            Aim.setValue('elmabv/democrane/actual/x', targetpos.posx)
            Aim.setValue('elmabv/democrane/actual/y', targetpos.posy)
            Aim.setValue('elmabv/democrane/actual/z', targetpos.posz)
            this.movedone();
            delete this.movedone;
          } else {
            setpos();
          }
        }
      }
    }

    stockpos.forEach(pos => {
      const {width,height,depth,posx,posy,posz} = pos;
      const geo = new THREE.BoxGeometry( width,height,depth );
      const edges = new THREE.EdgesGeometry( geo );
      const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x777777 } ) );
      const px = posx + -size/2 + geo.parameters.width/2;
      const pz = -posz + size/2 - geo.parameters.depth/2;
      const py = posy + geo.parameters.height/2;
      line.position.set(px,py,pz);
      // holder.add(line);
    })
    const gripper = new Gripper([maxY+1,maxZ,maxX]);

    (function mqttInit(){
      let x = 0,y = 0,z = 0;
      var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
      mqttClient.onConnectionLost = function (responseObject) {
        console.error("connection lost: " + responseObject.errorMessage);
      };
      mqttClient.onMessageArrived = function (message) {
        console.debug(message.destinationName, '=', message.payloadString);
        switch (message.destinationName) {
          case 'elmabv/democrane/axis/x': return gripper.moveto([y,z,x = Number(message.payloadString)]);
          case 'elmabv/democrane/axis/y': return gripper.moveto([y = message.payloadString,z,x]);
          case 'elmabv/democrane/axis/z': return gripper.moveto([y,z = message.payloadString, x]);
          case 'elmabv/democrane/state': {
            switch (message.payloadString) {
              case 'put': return new Container([0,0,0]);
              case 'get': {
                const container = containers.find(container => container instanceof Container && !container.get);
                container.get = true;
                return go();
              };
            }
          }
        }
      };
      var options = {
        useSSL: location.protocol === 'https:' ? true : false,
        // userName : "***",
        // password : "********",
        timeout: 3,
        onSuccess() {
          console.log("mqtt connected");
          // Connection succeeded; subscribe to our topic, you can add multile lines of these
          mqttClient.subscribe('elmabv/democrane/#', { qos: 1 });
          Aim.setValue = function (path,value){
            //use the below if you want to publish to a topic on connect
            message = new Paho.MQTT.Message(String(value));
            message.destinationName = path;
            mqttClient.send(message);
          }
        },
        onFailure(message) {
          console.log("Connection failed: " + message.errorMessage);
        }
      };
      mqttClient.connect(options);
    })()
    // (async function start(){
    //   await new Container([0,0,0]).movetopos([0,2,6]);
    //   await new Container([0,0,2]).movetopos([0,2,7]);
    //   await gripper.movetopos([3,2,5]);
    // })()
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }
  function render() {
    renderer.render(scene, camera);
  }
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.zoomSpeed= 0.1;
  controls.zoomSpeed= 0.8;
  controls.addEventListener('change', render);
  function animate() {
    containers.forEach(container => container.move());

    requestAnimationFrame( animate );
    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;
    renderer.render( scene, camera );
  }




});
