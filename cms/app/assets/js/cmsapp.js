const serviceRoot = 'https://aliconnect.nl/v1';
const socketRoot = 'wss://aliconnect.nl:444';
const mqttbroker = "aliconnect.nl";
const mqttport = location.protocol === 'https:' ? 1884 : 1338;
console.log(location.protocol);

Web.on('loaded', async event => {
  var mqttClient = new Paho.MQTT.Client(mqttbroker, mqttport, "myclientid_" + parseInt(Math.random() * 100, 10));
  mqttClient.onConnectionLost = function (responseObject) {
    console.error("connection lost: " + responseObject.errorMessage);
  };
  mqttClient.onMessageArrived = function (message) {
    console.debug(message.destinationName, '=', message.payloadString);
    document.body.querySelectorAll(`input[name="${message.destinationName}"]`).forEach(el => el.value = message.payloadString);
  };
  var options = {
    useSSL: location.protocol === 'https:' ? true : false,
    timeout: 3,
    onSuccess() {
      console.log("mqtt connected");
      // Connection succeeded; subscribe to our topic, you can add multile lines of these
      mqttClient.subscribe('elmabv/democrane/app/#', { qos: 1 });
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
        $('form').class('fields').append(
          $('div').class('field').append(
            $('label').text('Mailaddress'),
            $('input').name('mailaddress').type('email').required(true).value(localStorage.getItem("mailaddress")),
            // $('span').text('pos'),
          ),
          $('div').class('field').append(
            $('label').text('Nr'),
            $('input').name('nr').type('number').pattern('[0-9]*').min(0),
            // $('span').text('pos'),
          ),
          $('nav').class('elma').append(
            $('button').text('Verzenden').on('click', e => {

            }),
          ),
        ).on('submit', e => {
          e.preventDefault();
          if (e.target.nr.value) {
            Aim.setValue('elmabv/democrane/app/get', e.target.nr.value);
          } else {
            Aim.setValue('elmabv/democrane/app/add', e.target.mailaddress.value);
            localStorage.setItem("mailaddress", e.target.mailaddress.value);
          }
        }),
      ),
    ),
    $('footer').append(
    ),
  );
});
