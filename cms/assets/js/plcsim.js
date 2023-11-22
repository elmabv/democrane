const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';

Web.on('loaded', async event => {
  const {config} = Aim;
  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/config').get().then(config);
  await Aim.fetch('https://aliconnect.nl/elmabv/democrane/api/data').get().then(config);
  const {democrane} = config;
  const {floor} = democrane;
  function Crane(){
    let x=0,y=0,z=0;
    this.movex = function(posx){
      // x = posx;
      Aim.setValue('elmabv/democrane/plc/axisx/pos', x = posx);
      // axisx.position.x = posx - (floor.length - width) / 2;
    }
    this.movez = function(posz){
      Aim.setValue('elmabv/democrane/plc/axisz/pos', z = posz);
      // axisz.position.z = posz - (floor.width - depth) / 2;
    }
    this.movey = function(posy){
      Aim.setValue('elmabv/democrane/plc/axisy/pos', y = posy);
      // axisy.position.y = -floor.height + 5000 + posy - 500 + height;
    }
    // this.movex(0);
    // this.movey(0);
    // this.movez(0);
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
      // console.log('movetopos', pos);
      Aim.setValue('elmabv/democrane/plc/state', 'run');
      return new Promise((success,fail) => {
        const {posx,posy,posz} = pos;
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
            Aim.setValue('elmabv/democrane/plc/state', 'success');
            success();
          }
        })()
      })
    }
  }
  const crane = new Crane();

  var mqttClient = new Paho.MQTT.Client("aliconnect.nl", 'https:' ? 1884 : 1338, "myclientid_" + parseInt(Math.random() * 100, 10));
  mqttClient.onConnectionLost = function (responseObject) {
    console.error("connection lost: " + responseObject.errorMessage);
  };
  mqttClient.onMessageArrived = async function (message) {
    // console.debug(message.destinationName, '=', message.payloadString);
    document.body.querySelectorAll(`input[name="${message.destinationName}"]`).forEach(el => el.value = message.payloadString);
    switch (message.destinationName) {
      case 'elmabv/democrane/plc/state': {
        switch (message.payloadString) {
          case 'goto': {
            await crane.movetopos({
              posx: document.body.querySelector(`input[name="elmabv/democrane/plc/axisx/targetpos"]`).value,
              posy: document.body.querySelector(`input[name="elmabv/democrane/plc/axisy/targetpos"]`).value,
              posz: document.body.querySelector(`input[name="elmabv/democrane/plc/axisz/targetpos"]`).value,
            });
            return;
          }
        }
        return;
      }
    }
  };
  var options = {
    useSSL: location.protocol === 'https:' ? true : false,
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
      // (async function(){
      //   await crane.movetopos({posx:0,posy:0,posz:0});
      //   await crane.movetopos({posx:10,posy:10,posz:10});
      // })()

    },
    onFailure(message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  };
  mqttClient.connect(options);
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
      $('div').append(
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
        $('button').text('Test1').on('click', e => Aim.setValue('elmabv/democrane/plc/state', 'test1')),
        // $('button').text('Put').on('click', e => Aim.setValue('elmabv/democrane/state', 'put')),
        // $('button').text('Get').on('click', e => Aim.setValue('elmabv/democrane/state', 'get')),
      ),
    ),
    $('footer').append(
      $('nav').class('elma').append(
        $('button').text('Stop').on('click', e => Aim.setValue('elmabv/democrane/state', 0)),
        $('button').text('Start').on('click', e => Aim.setValue('elmabv/democrane/state', 1)),
      ),
    ),
  );
  setInterval(() => {
    $('header>div:last-child>:first-child').text(new Date().toLocaleDateString());
    $('header>div:last-child>:last-child').text(new Date().toLocaleTimeString());
  }, 1000)
});
