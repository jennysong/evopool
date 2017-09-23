import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button } from 'react-bootstrap';
import DriverApp from './DriverApp'
import RiderApp from './RiderApp'
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome</h2>
          <p className="App-intro">
            In dapibus egestas ex quis posuere. Duis suscipit nec velit eget vulputate. Etiam in erat tristique, tincidunt lectus nec, fermentum nunc. Vivamus nec pharetra mi. Duis eu sagittis libero. Pellentesque diam tortor, dignissim eget lacus ut, elementum egestas nulla. Fusce augue diam, molestie in tortor quis, semper euismod lacus.
          </p>
          <Button bsStyle="primary" onClick={driverApp}>Driver</Button>
          <Button bsStyle="success" onClick={riderApp}>Rider</Button>
        </div>
      </div>
    );
  }
}

const driverApp = () => {
  ReactDOM.render(<DriverApp />, document.getElementById('root'));
}

const riderApp = () => {
  ReactDOM.render(<RiderApp />, document.getElementById('root'));
}

export default App;
