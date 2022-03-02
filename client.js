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