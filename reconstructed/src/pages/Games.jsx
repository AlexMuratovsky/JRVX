import React from "react";

const games = [
  {
    number: "01 / СЛОВА",
    title: "Виселица",
    description: "Угадайте слово за шесть ошибок. Русская клавиатура, семь категорий и полезные подсказки.",
    meta: "Логика и слова · Один игрок",
  },
  {
    number: "02 / РЕАКЦИЯ",
    title: "Pong",
    description: "Классический матч до семи очков. Три уровня сложности и сенсорное управление.",
    meta: "Реакция · Вы против JRVX",
  },
];

export default function Games() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">НЕБОЛЬШАЯ ПЕРЕЗАГРУЗКА</p>
          <h1>Мини-игры<span className="heading-dot">.</span></h1>
          <p className="date-subtitle">Пара минут для себя. Выберите игру — JRVX составит компанию.</p>
        </div>
      </div>
      <div className="game-grid">
        {games.map((game) => (
          <article className="game-card" key={game.title}>
            <p className="eyebrow">{game.number}</p>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <small>{game.meta}</small>
            <button type="button" className="button soft">Играть</button>
          </article>
        ))}
      </div>
      <p className="muted page-note">Без загрузок и регистрации. Игры работают прямо в JRVX.</p>
    </>
  );
}
