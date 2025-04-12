import { useContext, useEffect, useState } from "react";

const Users = (props) => {

    const [user, setUser] = useState("");
    const [password,setPassword]= useState("")

    useEffect(() => {
       setUser("ahmed")

        },[]);

        function change () {
            setUser("hichem")
          }

        function handleChange(event) {
            setPassword(event.target.value);
          }
          
        //   function connect () {
        //     axios.get('localhost:4000/login',{user,password})
        //     .then((response) => {
        //       setUser(response.data); // Set the fetched users to state
        //     })          
        // }


    return(
        <div>
             <div>
                <input type="text" value={password} onChange={handleChange} placeholder="Type something..."/>
                <p>You typed: {password}</p>

                 {/* <button onClick={connect}>Connect</button> */}
            </div>
            
            <div>    
            <button onClick={change}>change</button>
            </div>
            {user}
        </div>
    );
}
export default Users;