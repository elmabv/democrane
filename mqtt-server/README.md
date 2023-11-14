command
```
npm i
```

1. edit `node_modules/jsonschema/lib/validator.js`
1. goto line 111
1. comment `throw ...`

```js
if((typeof schema !== 'boolean' && typeof schema !== 'object') || schema === null){
  // throw new SchemaError('Expected `schema` to be an object or boolean');
}
```

command
```
node index
```
