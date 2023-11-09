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
      mqttClient.subscribe('elmabv/democrane/#', { qos: 1 });
    },
    onFailure(message) {
      console.log("Connection failed: " + message.errorMessage);
    }
  };
  mqttClient.connect(options);
  function setValue(topic,value){
    message = new Paho.MQTT.Message(String(value));
    message.destinationName = topic;
    mqttClient.send(message);
  }
  $(document.body).append(
    $('nav').append(
      $('button').text('Stop').on('click', e => setValue('elmabv/democrane/state', 0)),
      $('button').text('Start').on('click', e => setValue('elmabv/democrane/state', 1)),
      $('button').text('Put').on('click', e => setValue('elmabv/democrane/state', 'put')),
      $('button').text('Get').on('click', e => setValue('elmabv/democrane/state', 'get')),
    ),
    $('div').append(
      $('label').text('Target Pos X'),
      $('input').name('elmabv/democrane/axis/x').type('number').min(0).max(10).value(0).on('change', e => setValue(e.target.name, e.target.value)),
      $('label').text('Target Pos Y'),
      $('input').name('elmabv/democrane/axis/y').type('number').min(0).max(4).value(0).on('change', e => setValue(e.target.name, e.target.value)),
      $('label').text('Target Pos Z'),
      $('input').name('elmabv/democrane/axis/z').type('number').min(0).max(3).value(0).on('change', e => setValue(e.target.name, e.target.value)),
    ),
    $('div').append(
      $('label').text('Crane Pos X'),
      $('input').name('elmabv/democrane/actual/x').type('number').readonly(true),
      $('label').text('Crane Pos Y'),
      $('input').name('elmabv/democrane/actual/y').type('number').readonly(true),
      $('label').text('Crane Pos Z'),
      $('input').name('elmabv/democrane/actual/z').type('number').readonly(true),
    ),
  )
});
