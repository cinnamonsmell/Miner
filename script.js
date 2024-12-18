// Кнопки
const gameBtn = document.getElementById("gameBtn");
let point = 1000;
let USERNAME;
let game_id;

// Слушатели событий
gameBtn.addEventListener("click", startOrStopGame);
document
  .querySelector("#loginWrapper form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    auth();
  });

[...document.getElementsByClassName("point")].forEach((elem) => {
  elem.addEventListener("click", addPoint);
});

function addPoint(event) {
  let target = event.target;
  point = +target.innerHTML;
  const activeBtn = document.querySelector(".point.active");
  if (activeBtn) {
    activeBtn.classList.remove("active");
  }
  console.log(point);
  target.classList.add("active");
}

function startOrStopGame() {
  if (gameBtn.innerHTML === "ИГРАТЬ") {
    // Начать игру
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    gameBtn.style.backgroundColor = "red";
    startGame();
  } else {
    // Завершить игру
    gameBtn.innerHTML = "ИГРАТЬ";
    gameBtn.style.backgroundColor = "#66a663";
    stopGame();
  }
}

async function startGame() {
  let response = await sendRequest("new_game", "POST", {
    username: USERNAME,
    points: 1000,
  });

  if (response.error) {
    // Есть ошибка
    gameBtn.innerHTML = "ИГРАТЬ";
    alert(response.message);
  } else {
    // Перезаписываем id
    game_id = response.game_id;
    activeArea();
    updateUserBalance();
  }
}

async function stopGame() {
  let response = await sendRequest("stop_game", "POST", {
    username: USERNAME,
    game_id,
  });
  if (response.error) {
    // Есть ошибка
    gameBtn.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
    alert(response.message);
  } else {
    updateUserBalance();
    resetField();
  }
}

function activeArea() {
  const field = document.getElementsByClassName("field");

  for (let i = 0; i < field.length; i++) {
    field[i].addEventListener("contextmenu", setFlag);
    field[i].classList.add("active");
    let row = Math.trunc(i / 10);
    let column = i % 10;
    field[i].setAttribute("data-row", row);
    field[i].setAttribute("data-column", column);
    field[i].addEventListener("click", makeStep);
  }
}

async function makeStep(event) {
  let target = event.target;
  let row = +target.getAttribute("data-row");
  let column = +target.getAttribute("data-column");

  try {
    let response = await sendRequest("game_step", "POST", {
      game_id,
      row,
      column,
    });
    console.log(response);
    updateArea(response.table);
    if (response.error) {
      alert(response.message);
    } else {
      if (response.status == "Ok") {
      } else if (response.status == "Failed") {
        alert("Вы проиграли :(");
        gameBtn.innerHTML = "ИГРАТЬ";
        gameBtn.style.backgroundColor = "#66a663";
        setTimeout(() => resetField(), 2000);
      } else if (response.status == "Won") {
        alert("Вы выиграли!");
        updateUserBalance();
      }
    }
  } catch (error) {
    console.error(`Неправильные данные ${error}`);
  }
}

function updateArea(table) {
  let fields = document.querySelectorAll(".field");
  let a = 0;
  for (let i = 0; i < table.length; i++) {
    let row = table[i];
    for (let j = 0; j < row.length; j++) {
      let cell = row[j];
      let value = fields[a];
      if (cell === "") {
      } else if (cell === 0) {
        value.classList.remove("active");
      } else if (cell == "BOMB") {
        value.classList.remove("active");
        value.classList.add("bomb");
      } else if (cell > 0) {
        value.classList.remove("active");
        value.innerHTML = cell;
      }
      a++;
    }
  }
}

function setFlag(event) {
  event.preventDefault();
  let target = event.target;
  target.classList.toggle("flag");
}

function resetField() {
  const gameField = document.querySelector(".gameField");
  while (gameField.firstChild) {
    gameField.removeChild(gameField.firstChild);
  }
  for (let i = 0; i < 80; i++) {
    let cell = document.createElement("div");
    cell.classList.add("field");
    gameField.appendChild(cell);
  }
}

resetField();

async function auth() {
  try {
    const loginWrapper = document.getElementById("loginWrapper");
    const login = document.getElementById("login").value;
    let response = await sendRequest("user", "GET", {
      username: login,
    });
    if (response.error) {
      // Пользователь не зарегистрировался
      let registration = await sendRequest("user", "POST", {
        username: login,
      });
      if (registration.error) {
        alert(registration.message);
      } else {
        USERNAME = login;
        loginWrapper.style.display = "none";
        await updateUserBalance();
      }
    } else {
      USERNAME = login; // Обновляем юзернейм
      loginWrapper.style.display = "none";
      await updateUserBalance(); // Обновляем данные
    }
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    alert("Ошибка авторизации. Попробуйте ещё раз.");
  }
}

async function updateUserBalance() {
  let response = await sendRequest("user", "GET", {
    username: USERNAME,
  });

  if (response.error) {
    // Если есть ошибка
    alert(response.message);
  } else {
    const user = document.querySelector("header span");
    if (user) {
      user.innerHTML = `Пользователь ${response.username} баланс ${response.balance}`;
    }
  }
}

async function sendRequest(url, method, data) {
  url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

  try {
    let response;
    if (method === "POST") {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    } else if (method === "GET") {
      url = url + "?" + new URLSearchParams(data);
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    return { error: true, message: error.message };
  }
}
