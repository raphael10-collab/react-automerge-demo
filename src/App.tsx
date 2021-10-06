import React from 'react';
import './App.css';

//import openDoc from './lib/automerge-store'

// https://dev.to/estheragbaje/how-to-use-react-hooks-to-create-a-counter-component-1bmp

function App() {

  const [count, setCount] = React.useState(0);


  // Create handleIncrement event handler
  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  //Create handleDecrement event handler
  const handleDecrement = () => {
    setCount(prevCount => prevCount - 1);
  };



  return (
    <div className="App">
      <div>
        <header></header>
        <button onClick={handleDecrement}>-</button>
        <h5>Count is {count}</h5>
        <button onClick={handleIncrement}>+</button>
      </div>
      <button onClick={() => setCount(0)}>Reset</button>


    </div>
  );
}

export default App;
