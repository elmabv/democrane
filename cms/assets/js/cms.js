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

  let camera, scene, renderer;
  let mesh;
  const size = 30000;
  const containers = config.containers || [];
  console.log(democrane, floor, containers);
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

  function contractLetter(nr){
    return $('body').append(
      $('link').rel('stylesheet').href('https://elma.aliconnect.nl/assets/css/elma-print.css'),
      $('header').append(
        $('table').style('color:#0A6EAC;').append(
          $('tr').append(
            $('td').style('width:80mm;').append(
              $('img').src('https://elma.aliconnect.nl/assets/image/elma-logo.png'),
            ),
            $('td').append(
              $('div').text('Elma B.V.'),
              $('div').text('Centurionbaan 150'),
              $('div').text('3769 AV Soesterberg'),
              $('div').text('The Netherlands'),
            ),
            $('td').append(
              $('div').text(''),
              $('div').text('t +31(0)346 35 60 60'),
              $('div').text('e elma@elmabv.nl'),
              $('div').text('i www.elmatechnology.com'),
            ),
          ),
        ),
      ),
      $('main').append(
        $('table').append(
          $('tr').append(
            $('td').colspan(4).style('padding:10mm 0;').append(
              $('div').text('data.companyName'),
              $('div').text('attn.', 'De heer aaa'),
              $('div').text('Centurionbaan 150'),
              $('div').text('3769 AV Soesterberg'),
              $('div').text('The Netherlands'),
            ),
          ),
          $('tr').append(
            $('th').text('Date').style('width:30mm;'),
            $('td').text('20-20-2023').style('width:40mm;'),
            $('th').text('Related by').style('width:30mm;'),
            $('td').text('Aart Versluis').style('width:50mm;'),
          ),
          $('tr').append(
            $('th').text('Your reference'),
            $('td').text('data.yourReference'),
            $('th').text('Direct phone'),
            $('td').text('Aart Versluis'),
          ),
          $('tr').append(
            $('th').text('Our reference'),
            $('td').text('412341'),
            $('th').text('Email address'),
            $('td').text('aart.versluis@elmabv.nl'),
          ),
        ),
        $('p').text('Geachte heer van Eck'),
        $('p').text('Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. Hierbij doen wij u een offerte toekomen. '),
        $('h1').style('page-break-before: always;').text('Delivering conditions'),
        $('table').append(
          $('tr').append(
            $('th').text('Delivery time').style('width:30mm;'),
            $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
          ),
          $('tr').append(
            $('th').text('Delivery time'),
            $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
          ),
          $('tr').append(
            $('th').text('Delivery time'),
            $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
          ),
          $('tr').append(
            $('th').text('Delivery time'),
            $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
          ),
          $('tr').append(
            $('th').text('Delivery time'),
            $('td').text('Fjgjhksd ajsdlfkjaskdlf ja'),
          ),
        ),
        // $('p').style('page-break-after: never;').text('Page 2'),
      ),
    );

  }

  async function addcontainer(nr){
    const freeindex = stockpos.findIndex(pos => !pos.type && !pos.container);
    const container = new Aim.Container();
    container.nr = nr;
    containers.push(container);
    container.moveto(1);
    await Aim.goto(stockpos[1]);
    container.moveto(0);
    await Aim.goto(stockpos[freeindex]);
    container.moveto(freeindex);
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
      $('form').style('flex:0 1 300px;').append(
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
          // $('div').class('field').append(
          //   $('label').text('Nr'),
          //   $('input').name('containernr').type('number').min(0),
          //   // $('span').text('mm'),
          // ),
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
        // $('button').text('Get container').on('click', async e => {
        //   const containernr = $('main>form').el.containernr.value;
        //   const container = containers.find(container => container.nr == containernr);
        //   if (!container) return alert('Container niet bekend');
        //   containers.splice(containers.indexOf(container), 1);
        //   await Aim.goto(stockpos[container.stockindex]);
        //   container.moveto(0);
        //   await Aim.goto(stockpos[1]);
        //   container.moveto(1);
        // }),
        // $('button').text('Add container').on('click', addcontainer),
      ),
    ),
    $('footer').append(
      $('nav').class('elma').append(
        $('button').text('Stop').on('click', e => Aim.setValue('elmabv/democrane/state', 0)),
        $('button').text('Start').on('click', e => Aim.setValue('elmabv/democrane/state', 1)),
        // $('button').style('margin-left:auto;').text('App').on('click', e => window.open("app/index.html", "app", "width=400,height=600,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes")),
        $('button').style('margin-left:auto;').text('App').on('click', e => window.open("app/index.html", "app", "width=400,height=600,popup")),
        $('button').text('PLC sim').on('click', e => window.open("plcsim.html", "plcsim", "width=600,height=300,popup")),
      ),
    ),
  );

  Aim.goto = function(pos) {
    const {posx,posy,posz} = pos;
    console.log({posx,posy,posz});
    return new Promise((success,fail) => {
      Aim.success = success;
      Aim.fail = fail;
      Aim.setValue('elmabv/democrane/plc/axisx/targetpos', posx);
      Aim.setValue('elmabv/democrane/plc/axisy/targetpos', posy);
      Aim.setValue('elmabv/democrane/plc/axisz/targetpos', posz);
      Aim.setValue('elmabv/democrane/plc/state', 'goto');
    });
  }

  const parentElement = document.querySelector('.threeview');
  let crane;
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
    function box(width, height, depth, material = {color: 0x888888}, x = 0, y = 0, z = 0){
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry( width, height, depth ),
        new THREE.MeshPhongMaterial (material),
      )
      mesh.position.set(x,y,z);
      return mesh;
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
    const gap = 1000;
    var floorGeometry = new THREE.PlaneGeometry(floor.length, floor.width, 0, 0);
    var floormesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floormesh.rotation.x = -Math.PI / 2;
    holder.add(floormesh);

    camera = new THREE.PerspectiveCamera( 70, 1, 1, floor.length * 2 );
    camera.position.z = 0;
    camera.position.y = floor.height;
    camera.position.x = -floor.length;

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
      holder.add(box(500,floor.height,500).setPosition(i*floor.length/6,0,floor.width-500));
      // holder.add(box(500,500,floor.width).setPosition(i*10000,floor.height,0));
    }
    // plaatsen gelijders
    holder.add(box(floor.length,500,500).setPosition(0,floor.height-5000,500));
    holder.add(box(floor.length,500,500).setPosition(0,floor.height-5000,floor.width-1000));

    const minx = 3000;
    const minz = 6000;
    function Crane(){
      const axisx = new THREE.Group();
      axisx.add(box(500,500,floor.width-1000,{color: 'yellow'},1000,floor.height-5000+750,0));
      axisx.add(box(500,500,floor.width-1000,{color: 'yellow'},-1000,floor.height-5000+750,0));
      holder.add(axisx);
      var axisz = new THREE.Group();
      axisz.add(box(4000,1500,depth,{color: 'orange'},0,floor.height-5000+1500,0));
      axisx.add(axisz);
      var axisy = box(width,500,depth,{color: 'yellow'});
      axisz.add(axisy);
      let x=0,y=0,z=0;
      this.movex = function(posx){
        x = posx;
        axisx.position.x = posx - floor.length / 2 + minx;
      }
      this.movez = function(posz){
        z = posz;
        axisz.position.z = posz - floor.width / 2 + minz;
      }
      this.movey = function(posy){
        y = posy;
        axisy.position.y = posy + height;
      }
      this.movex(0);
      this.movey(0);
      this.movez(0);
      const pos = {depth,width,height,posx:0,posy:0,posz:0,type:1};
      axisy.add(pos.mesh = new Aim.Stockpos(pos));
      pos.mesh.position.set(0,-height/2-300,0);
      stockpos.unshift(pos);
      // const index = stockpos.push(pos);
    }
    Aim.Stockpos = function(pos) {
      const {width,height,depth,posx,posy,posz} = pos;
      const geo = new THREE.BoxGeometry( width,height,depth );
      const edges = new THREE.EdgesGeometry( geo );
      const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x777777, transparent: true, opacity: 0.3 } ) );
      line.position.set(posx - floor.length/2 + minx, posy + geo.parameters.height/2, posz - floor.width/2 + minz);
      return line;
    }
    Aim.Container = function(setting = {}) {
      Object.assign(this,setting);
      const geo = new THREE.BoxGeometry(width,height,depth);
      const mesh = this.mesh = new THREE.Mesh(geo,material);
      holder.add(mesh);
      this.moveto = function(index, save = true){
        this.stockindex = index;
        stockpos[index].mesh.add(mesh);
        stockpos[index].container = this;
        if (save) {
          Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/data').body({containers:containers.map(({stockindex,nr}) => Object({stockindex,nr}))}).post();
        }
      }
      this.moveto(setting.stockindex || 1, false);
    }
    stockpos.push({posx:3000,posy:0,posz:floor.width/2,depth,width,height,type:1});
    var [maxX,maxY,maxZ] = [15,5,5];
    for (var posy = 0, y = 0; y<maxY; y++, posy += height) {
      for (var posz = minz,z = 0; z<maxZ; z++, posz += depth+gap) {
        for (var posx = minx + 6000, x = 0; x<maxX; x++, posx += width+gap) {
          stockpos.push({x,y,z,posx,posy,posz,depth,width,height});
        }
      }
    }

    stockpos.forEach((pos,i) => holder.add(stockpos[i].mesh = new Aim.Stockpos(pos)));
    crane = new Crane();
    containers.forEach((item,i,items) => items[i] = new Aim.Container(item));
    (function mqttInit(){
      let x = 0,y = 0,z = 0;
      var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
      mqttClient.onConnectionLost = function (responseObject) {
        console.error("connection lost: " + responseObject.errorMessage);
      };
      mqttClient.onMessageArrived = async function (message) {
        document.body.querySelectorAll(`input[name="${message.destinationName}"]`).forEach(el => el.value = message.payloadString);
        switch (message.destinationName) {
          case 'elmabv/democrane/plc/axisx/pos': return crane.movex(Number(message.payloadString));
          case 'elmabv/democrane/plc/axisy/pos': return crane.movey(Number(message.payloadString));
          case 'elmabv/democrane/plc/axisz/pos': return crane.movez(Number(message.payloadString));
          case 'elmabv/democrane/plc/state': {
            switch (message.payloadString) {
              case 'success': return Aim.success();
            }
            return;
          }
          case 'elmabv/democrane/app/add': {
            console.log(message.payloadString);
            const elem = contractLetter();
            const nr = Math.round(Math.random() * 999999);

            // console.log();
            Aim.fetch('https://aliconnect.nl/v1/mailer').body({
              to: message.payloadString,//'max.van.kampen@outlook.com',
              from: 'max.van.kampen@alicon.nl',
              // 'bcc'=> 'max.van.kampen@alicon.nl',
              chapters: [
                {
                  title:"Container opslag overeenkomst",
                  content: `Dank voor uw opdracht. Uw container wordt opgeslagen onder nr <b>${nr}</b>`,
                }
              ],
              attachements: [
                {
                  name: 'Container opslag contract.pdf',
                  content: elem.el.outerHTML,
                },
              ],
            }).post().then(e => {
              elem.remove();
              addcontainer(nr);
              console.log('Nr toegevoegd', nr);
            });

            return false;

          }
          case 'elmabv/democrane/app/get': {
            console.log(message.payloadString);
            const containernr = message.payloadString;
            const container = containers.find(container => container.nr == containernr);
            if (!container) return console.error('Container niet bekend');
            containers.splice(containers.indexOf(container), 1);
            await Aim.goto(stockpos[container.stockindex]);
            container.moveto(0);
            await Aim.goto(stockpos[1]);
            container.moveto(1);
          }
        }
        console.debug(message.destinationName, '=', message.payloadString);
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
    onWindowResize();
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
  init();
  animate();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.zoomSpeed= 0.1;
  // controls.zoomSpeed= 0.8;
  controls.addEventListener('change', render);
  function animate() {
    // containers.forEach(container => container.move());
    requestAnimationFrame( animate );
    // mesh.rotation.x += 0.005;
    // mesh.rotation.y += 0.01;
    renderer.render( scene, camera );
  }
});
