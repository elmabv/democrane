const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';

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
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, size*2 );
    camera.position.z = size/2;
    camera.position.y = size/2;
    scene = new THREE.Scene();
    holder = new THREE.Group();
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    var floorMaterial = new THREE.MeshBasicMaterial({ color: 0x999999 });
    var floorGeometry = new THREE.PlaneGeometry(size, size, 0, 0);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    holder.add(floor);
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
      )
    }
    const wandHoogte = 5000;
    const wandDikte = 300;
    const wallmat = {
      color: 0x888888,
      opacity: 0,
      transparent: true,
    }
    holder.add(
      box(wandDikte,wandHoogte,26000).setPosition(0, 0, 4000),
      box(wandDikte,wandHoogte,26000).setPosition(30000-wandDikte, 0, 4000),
      box(30000,wandHoogte,wandDikte).setPosition(0, 0, 30000),
      // box(30000,1000,wandDikte).setPosition(0, 0, 12000),

      // box(100,2500,6000,wallmat).setPosition(30000 - 5000, 0, 12000),
      // box(5000,2500,100,wallmat).setPosition(30000 - 5000, 0, 12000 + 6000),
      // box(5000,100,6000,wallmat).setPosition(30000 - 5000, 2500, 12000),
    );
    var light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
    light.position.set(0, 5000, 5000);
    holder.add(light);
    var light = new THREE.DirectionalLight(0xFFFFFF, 1);
    var light = new THREE.PointLight(0xffffff, 0.8, 0, 1000);
    light.position.set(0,5000,-5000);
    holder.add(light);

    const [depth,width,height] = [6060,2430,2590];

    const [maxY,maxZ,maxX] = [2,3,10];
    for (var posy = 20, y = 0; y<=maxY+1; y++, posy += 2600) {
      indexpos[y] = [];
      for (var posz = 4000,z = 0; z<=maxZ; z++, posz += 6100) {
        indexpos[y][z] = [];
        for (var posx = 500, x = 0; x<=maxX; x++, posx += 2500) {
          stockpos.push(indexpos[y][z][x] = {x,y,z,posx,posy,posz,depth,width,height,type:1});
        }
      }
    }


    let busy = false;
    const speed = 200;
    async function go(){
      console.log('GO',busy);
      if (busy) return;
      const container = containers.filter(container => container instanceof Container).find(container => !container.put || container.get==1);
      if (container) {
        const freespot = container.get ? indexpos.flat(3).filter(pos => pos.z==0 && pos.y==0).find(pos => !pos.container) : indexpos.flat(3).filter(pos => pos.z>0 && pos.y<=maxY-1).find(pos => !pos.container);
        console.log('READY', {container, freespot});
        if (freespot) {
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
          freespot.container = container;
          go(busy = false);
        }
      }
    }

    function Container(newpos) {
      const freespot = this.spot = indexpos.flat(3).filter(pos => pos.z==0 && pos.y==0).find(pos => !pos.container);
      if (!freespot) return;
      const {y,z,x} = freespot;
      freespot.container = this;
      this.targetx = x;
      this.targety = y;
      this.targetz = z;
      const targetpos = indexpos[y][z][x];
      let {width,height,depth,posx,posy,posz} = targetpos;
      const geo = new THREE.BoxGeometry(width,height,depth);
      const material = new THREE.MeshPhongMaterial ({color: 'blue'});
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
      const material = new THREE.MeshPhongMaterial ({color: 'red'});
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
      holder.add(line);
    })
    const gripper = new Gripper([maxY+1,maxZ,maxX]);

    $('html>body').append(
      $('nav').style('position:fixed;top:0;width:100%;').append(
        $('button').text('PUT').on('click', async event => {
          new Container([0,0,0]);
        }),
        $('button').text('GET').on('click', async event => {
          const container = containers.find(container => container instanceof Container && !container.get);
          container.get = true;
          go();
        }),
      ),
    );

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
  controls.zoomSpeed= 0.1;
  controls.addEventListener('change', render);
  function animate() {
    containers.forEach(container => container.move());

    requestAnimationFrame( animate );
    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;
    renderer.render( scene, camera );
  }
});
