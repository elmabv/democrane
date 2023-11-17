const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
const mqttbroker = "aliconnect.nl";
const mqttport = location.protocol === 'https:' ? 1884 : 1338;
const stockpos = [];
Web.on('loaded', async event => {
  const {config} = Aim;
  await Aim.fetch('https://elma.aliconnect.nl/elma/elma.github.io/assets/yaml/elma').get().then(config);
  await Aim.fetch('https://elmabv.aliconnect.nl/elmabv/elmabv.github.io/pwms/crane/config').get().then(config);

  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/config').get().then(config);
  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/data').get().then(config);

  await Web.require('https://aliconnect.nl/sdk/dist/js/three/three.js');
  await Web.require('https://aliconnect.nl/sdk/dist/js/three/OrbitControls.js');
  const {democrane} = config;
  const {floor} = democrane;
  console.log(democrane, floor);

  let camera, scene, renderer;
  let mesh;
  const size = 30000;
  const containers = [];
  const indexpos = [];

  THREE.Mesh.prototype.setPosition = function(x,y,z){
    // console.log(this, this.geometry.parameters);
    this.position.x = -floor.length/2+x+this.geometry.parameters.width/2;
    this.position.z = floor.width/2-z-this.geometry.parameters.depth/2;
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

  function setPosition(mesh,x,y,z){
    // const {x,y,z} = pos;
    mesh.position.x = -floor.length/2+x+mesh.geometry.parameters.width/2;
    mesh.position.z = floor.width/2-z-mesh.geometry.parameters.depth/2;
    mesh.position.y = y+mesh.geometry.parameters.height/2;
  }

  $(document.body).append(
    $('header').append(
      $('div').append(
      ),
      $('div').append(
      ),
      $('div').append(
        $('div'),
        $('div'),
      ),
    ),
    $('main').append(
      $('div').style('display:flex;').append(
        $('div').class('threeview').style('flex:1 1 auto;'),
      ),
      $('div').style('flex:0 1 300px;').append(
        $('div').class('fields').append(
          $('div').class('field').append(
            $('label').text('Target Pos X'),
            $('input').name('elmabv/democrane/plc/axisx/targetpos').type('number').pattern('[0-9]*').min(0).value(0).on('change', e => Aim.setValue(e.target.name, e.target.value)),
            $('span').text('pos'),
          ),
          $('div').class('field').append(
            $('label').text('Target Pos Y'),
            $('input').name('elmabv/democrane/plc/axisy/targetpos').type('number').pattern('[0-9]*').min(0).value(0).on('change', e => Aim.setValue(e.target.name, e.target.value)),
            $('span').text('pos'),
          ),
          $('div').class('field').append(
            $('label').text('Target Pos Z'),
            $('input').name('elmabv/democrane/plc/axisz/targetpos').type('number').pattern('[0-9]*').min(0).value(0).on('change', e => Aim.setValue(e.target.name, e.target.value)),
            $('span').text('pos'),
          ),
        ),
        $('div').class('fields').append(
          $('div').text('Container position'),
          $('div').class('field').append(
            $('label').text('Target Pos'),
            $('input').name('indexpos').type('number').pattern('[0-9]*').min(0).value(0),
            $('span').text('pos'),
          ),
        ),
        $('div').class('fields').append(
          $('div').class('field').append(
            $('label').text('Crane Pos X'),
            $('input').name('elmabv/democrane/plc/axisx/pos').type('number').min(0).disabled(true),
            $('span').text('mm'),
          ),
          $('div').class('field').append(
            $('label').text('Crane Pos Y'),
            $('input').name('elmabv/democrane/plc/axisy/pos').type('number').min(0).disabled(true),
            $('span').text('mm'),
          ),
          $('div').class('field').append(
            $('label').text('Crane Pos Z'),
            $('input').name('elmabv/democrane/plc/axisz/pos').type('number').min(0).disabled(true),
            $('span').text('mm'),
          ),
        ),
      ),
      $('nav').append(
        $('button').text('Goto').on('click', e => Aim.setValue('elmabv/democrane/plc/state', 'goto')),
        $('button').text('Goto index').on('click', e => {
          const indexpos = Number(document.body.querySelector(`input[name="indexpos"]`).value)
          const {posx,posy,posz} = stockpos[indexpos];
          console.log({indexpos,posx,posy,posz});
          Aim.setValue('elmabv/democrane/plc/axisx/targetpos', posx);
          Aim.setValue('elmabv/democrane/plc/axisy/targetpos', posy);
          Aim.setValue('elmabv/democrane/plc/axisz/targetpos', posz);
          Aim.setValue('elmabv/democrane/plc/state', 'goto');
          // Aim.setValue('elmabv/democrane/plc/state', 'goto');
        }),
        $('button').text('Add container').on('click', async e => {

          return new Aim.Container([0,0,0]);
        }),
        // $('button').text('Put').on('click', e => Aim.setValue('elmabv/democrane/state', 'put')),
        // $('button').text('Get').on('click', e => Aim.setValue('elmabv/democrane/state', 'get')),
      ),
    ),
    $('footer').append(
      $('nav').class('elma').append(
        $('button').text('Stop').on('click', e => Aim.setValue('elmabv/democrane/state', 0)),
        $('button').text('Start').on('click', e => Aim.setValue('elmabv/democrane/state', 1)),
        // $('button').style('margin-left:auto;').text('App').on('click', e => window.open("app/index.html", "app", "width=400,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes")),
        $('button').style('margin-left:auto;').text('App').on('click', e => window.open("app/index.html", "app", "width=400,height=600,popup")),
        $('button').text('PLC sim').on('click', e => window.open("plcsim.html", "plcsim", "popup")),
      ),
    ),
  );


  const parentElement = document.querySelector('.threeview');
  let crane;
  init();
  animate();

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('rgb(51,51,51)');
    holder = new THREE.Group();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    parentElement.appendChild( renderer.domElement );

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


    const scale = 32;
    const [depth,width,height] = [6060,2440,2590];
    // const [depth,width,height] = [6100,2500,2600];
    const gap = 1000;
    stockpos.push({posx:floor.length-width-3000,posy:0,posz:(floor.width-depth)/2,depth,width,height,type:0});
    var [maxY,maxZ,maxX] = [5,5,50];
    var [maxY,maxZ,maxX] = [5,5,15];
    for (var posy = 20, y = 0; y<maxY; y++, posy += height) {
      indexpos[y] = [];
      for (var posz = 3000,z = 0; z<maxZ; z++, posz += depth+gap) {
        indexpos[y][z] = [];
        for (var posx = 3000, x = 0; x<maxX; x++, posx += width+gap) {
          stockpos.push(indexpos[y][z][x] = {x,y,z,posx,posy,posz,depth,width,height,type:1});
        }
      }
    }
    console.log({posx,posy,posz});

    var floorGeometry = new THREE.PlaneGeometry(floor.length, floor.width, 0, 0);
    var floormesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floormesh.rotation.x = -Math.PI / 2;
    holder.add(floormesh);


    camera = new THREE.PerspectiveCamera( 70, 1, 1, posx*2 );
    camera.position.z = 0;
    camera.position.y = floor.height;
    camera.position.x = floor.length;
    onWindowResize();

    holder.add(
      // box(wandDikte,wandHoogte,26000).setPosition(0, 0, 4000),
      // box(wandDikte,wandHoogte,26000).setPosition(posx-wandDikte, 0, 4000),
      // box(posx,wandHoogte,wandDikte).setPosition(0, 0, posx),
      // box(30000,1000,wandDikte).setPosition(0, 0, 12000),

      // box(100,2500,6000,wallmat).setPosition(30000 - 5000, 0, 12000),
      // box(5000,2500,100,wallmat).setPosition(30000 - 5000, 0, 12000 + 6000),
      // box(5000,100,6000,wallmat).setPosition(30000 - 5000, 2500, 12000),
    );

    const loader = new THREE.TextureLoader().setPath( 'assets/img/' );
    const material = this.material = [
      new THREE.MeshBasicMaterial({ map: loader.load('container-side.png') }), //right side
      new THREE.MeshBasicMaterial({ map: loader.load('container-side.png')}), //left side
      new THREE.MeshBasicMaterial({ map: loader.load('container-top.png')}), //top side
      new THREE.MeshBasicMaterial({ map: loader.load('container-top.png')}), //bottom side
      new THREE.MeshBasicMaterial({ map: loader.load('container-front.png')}), //front side
      new THREE.MeshBasicMaterial({ map: loader.load('container-back.png')}), //back side
    ];

    // plaatsen staanders
    for (let i=0;i<=6;i++) {
      holder.add(box(500,floor.height,500).setPosition(i*floor.length/6,0,0));
      holder.add(box(500,floor.height,500).setPosition(i*floor.length/6,0,floor.width));
      // holder.add(box(500,500,floor.width).setPosition(i*10000,floor.height,0));
    }
    // plaatsen gelijders
    holder.add(box(floor.length,500,500).setPosition(0,floor.height-5000,0));
    holder.add(box(floor.length,500,500).setPosition(0,floor.height-5000,floor.width));

    for (let i=0;i<100;i++) {
      const [depth,width,height] = [6060,2440,2590];
      democrane.containers.push({width,height,depth,pos:i+1});
    }

    // democrane.boxes.forEach(({dim,pos})=>holder.add(box(...dim).setPosition(...pos)));
    function newcontainer(container) {
      const {width,height,depth} = container;
      const geo = new THREE.BoxGeometry(width,height,depth);
      const mesh = new THREE.Mesh(geo,material);
      holder.add(mesh);
      return mesh;
    }

    function Crane(){
      // const axisx = new THREE.Group();
      const axisx = box(500,500,floor.width,{color: 'yellow'}).setPosition(0,floor.height-5000,0);
      holder.add(axisx);
      var box1 = box(500,500,floor.width,{color: 'yellow'});
      box1.position.x = 4000;
      axisx.add(box1);
      var axisz = box(4000,500,depth,{color: 'yellow'});
      axisz.position.y = 500;
      axisz.position.x = 2000;
      axisx.add(axisz);

      var axisy = box(4000,500,depth,{color: 'orange'});
      // axisz.position.y = 500;
      // axisz.position.x = 2000;
      axisz.add(axisy);
      let x=0,y=0,z=0;
      // axisx.setPosition(0,0,0);
      // axisx.add(box(500,500,floor.width,{color: 'yellow'}).setPosition(4000,floor.height-5000,0));
      this.movex = function(posx){
        x = posx;
        axisx.position.x = posx - (floor.length - width) / 2;
      }
      this.movez = function(posz){
        z = posz;
        axisz.position.z = posz - (floor.width - depth) / 2;
      }
      this.movey = function(posy){
        y = posy;
        axisy.position.y = -floor.height + 5000 + posy - 500 + height;
      }
      this.movex(0);
      this.movey(0);
      this.movez(0);
      const speed = 200;
      this.pick = function(pos) {
        return new Promise((success,fail) => {
          this.movetopos(pos).then(success);
        })
      }
      this.place = function(pos) {
        return new Promise((success,fail) => {
          this.movetopos(pos).then(success);
        })
      }

      this.movetopos = function(pos){
        return new Promise((success,fail) => {
          const {posx,posy,posz} = stockpos[pos];
          const self = this;
          let goUp = true;
          const topy = floor.height-5000-3000;
          (function recursive() {
            // console.log({x,y,z,posx,posy,posz});
            if (goUp) {
              self.movey(y + Math.max(-speed,Math.min(topy-y,speed)));
              if (topy != y) {
                return setTimeout(recursive, 10);
              } else {
                goUp = false;
              }
            }
            if (x != posx || z != posz) {
              if (x != posx) {
                self.movex(x + Math.max(-speed,Math.min(posx-x,speed)));
              }
              if (z != posz) {
                self.movez(z + Math.max(-speed,Math.min(posz-z,speed)));
              }
            } else {
              if (y != posy) {
                self.movey(y + Math.max(-speed,Math.min(posy-y,speed)));
              }
            }
            if (x != posx || y != posy || z != posz) {
              setTimeout(recursive, 10);
            } else {
              success();
            }
          })()
        })
      }
    }
    crane = new Crane();
    // crane.movex(0);
    // crane.movez(0);
    // crane.movey(0);


    let busy = false;
    const speed = 100;
    async function go(){
      // console.log('GO',busy);
      if (busy) return;
      const container = containers.filter(container => container instanceof Aim.Container).find(container => !container.put || container.get==1);
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
    Aim.Container = function(newpos) {

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

    stockpos.forEach((pos,i) => {
      const {width,height,depth,posx,posy,posz} = pos;
      const geo = new THREE.BoxGeometry( width,height,depth );
      const edges = new THREE.EdgesGeometry( geo );
      const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x777777, transparent: true, opacity: 0.3 } ) );
      stockpos[i].mesh = line;
      // setPosition(line,posx,posy,posz);
      // console.log(size,floor)
      const px = posx + -floor.length/2 + geo.parameters.width/2;
      const pz = -posz + floor.width/2 - geo.parameters.depth/2;
      const py = posy + geo.parameters.height/2;
      line.position.set(px,py,pz);
      holder.add(line);
    })
    democrane.containers.forEach(container=>{
      container.mesh = newcontainer(container);
      container.setpos = function(){
        const {posx,posy,posz} = stockpos[container.pos];
        stockpos[container.pos].mesh.add(container.mesh);
        // container.mesh.position.set(posx,posy,posz);
      }
      container.setpos();
    });


    // const gripper = new Gripper([maxY-1,maxZ-1,maxX-1]);

    (function mqttInit(){
      let x = 0,y = 0,z = 0;
      var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
      mqttClient.onConnectionLost = function (responseObject) {
        console.error("connection lost: " + responseObject.errorMessage);
      };
      mqttClient.onMessageArrived = function (message) {
        console.debug(message.destinationName, '=', message.payloadString);
        document.body.querySelectorAll(`input[name="${message.destinationName}"]`).forEach(el => el.value = message.payloadString);
        switch (message.destinationName) {
          case 'elmabv/democrane/plc/axisx/pos': return crane.movex(Number(message.payloadString));
          case 'elmabv/democrane/plc/axisy/pos': return crane.movey(Number(message.payloadString));
          case 'elmabv/democrane/plc/axisz/pos': return crane.movez(Number(message.payloadString));
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
    var {clientWidth,clientHeight} = parentElement;
    clientHeight-=4;
    // camera.aspect = window.innerWidth / window.innerHeight;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( clientWidth, clientHeight);
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // console.log({offsetWidth,offsetHeight,clientWidth,clientHeight});
    // const ratio = clientWidth/clientHeight;


  }
  function render() {
    renderer.render(scene, camera);
  }
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.zoomSpeed= 0.1;
  // controls.zoomSpeed= 0.8;
  controls.addEventListener('change', render);
  function animate() {
    containers.forEach(container => container.move());
    requestAnimationFrame( animate );
    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;
    renderer.render( scene, camera );
  }
  // await crane.pick(0);
  // await crane.place(8);
});
