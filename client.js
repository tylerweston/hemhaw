function changeUsername() 
{
    // let text;
    // let person = prompt("Please enter your name:", "Harry Potter");
    // if (person == null || person == "") {
    //   text = "User cancelled the prompt.";
    // } else {
    //   text = "Hello " + person + "! How are you today?";
    // }
    // // document.getElementById("demo").innerHTML = text;

    // let name = document.getElementById('name').value;
    // if (name.length > 0) {
    //     user.name = name;
    //     document.getElementById('login').style.display = 'none';
    //     document.getElementById('game').style.display = 'block';
    //     // document.getElementById('name').value = '';
    //     // document.getElementById('name').disabled = true;
    // }
    // console.log(name);
    // tryLoadUser();
    let name = prompt("enter username:", "");
    if (name === null || name === "") {
        tryLoadUser();
        user.name = getRandomUserName();
        console.log(user);
    } else {
        tryLoadUser();
        user.name = name;
        console.log(user);
    }
}