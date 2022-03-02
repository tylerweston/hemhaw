function changeUsername() 
{
    let name = prompt("enter username:", "");
    if (name === null || name === "") {
        tryLoadUser();
        user.name = getRandomUserName();
    } else {
        tryLoadUser();
        user.name = name;
    }
}

// async function fetchAsync (url) {
//     let response = await fetch(url);
//     let data = await response.json();
//     return data;
// }