const Table = document.querySelector("table");
let scores = [];
try {
    scores = JSON.parse(localStorage.getItem("scoreboard")).data;
}
catch (e) {
    console.log("no scores");
}

if (scores.length) {
    const rows = scores.map(({ date, name, time, streaks, gameType, size, totalPoints, wrongTries, allowedTries, allowedTime }) => {
        const row = document.createElement("tr");
        const td = (value) => {
            const elem = document.createElement("td");
            elem.textContent = value;
            return elem;
        }
        row.appendChild(td(date));
        row.appendChild(td(name));
        row.appendChild(td(totalPoints));
        row.appendChild(td(time));
        row.appendChild(td(streaks));
        row.appendChild(td(wrongTries));
        row.appendChild(td(`${gameType} (Size - ${size}, Tries - ${allowedTries}, Time - ${allowedTime})`));
        return row;
    });
    for (const row of rows) {
        Table.appendChild(row)
    }
}