import logo from './logo.svg';
import './App.css';
import Users from './components/users';
import { Link, Route, Router, Routes } from 'react-router-dom';
import Login from './components/login';
import Services from './components/services';
import Navbar from './components/navbar';

function App() {
  return (
    <div>
    <Navbar/>
    <Routes>
      {/* <useContext> */}
      <Route path="/" element={<Services />} />
      <Route path="/about" element={<Users  />} />
      <Route path="/contact" element={<Login />} />
      {/* </useContext> */}
    </Routes>
  </div>
  );
}

export default App;
