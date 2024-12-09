//Кнопки
const gameBtn = document.getElementById("gameBtn");

//Слушатели событий
gameBtn.addEventListener("click", activeArea);

function activeArea() {
    const field = document.getElementsByClassName("field");
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    gameBtn.style.backgroundColor = "red";
    for (let i = 0; i < field.length; i++) {
        setInterval(() => {
            field[i].classList.add("active");
        }, 20 * i);
    }
}

