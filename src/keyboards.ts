import { Keyboard } from "grammy";

export const mainMenuKeyboard = new Keyboard()
  .text("Грамматика")
  .text("Практика")
  .row()
  .text("Свободное письмо")
  .text("Статистика")
  .resized();

export const grammarTheoryKeyboard = new Keyboard()
  .text("Практика на это правило")
  .row()
  .text("Другое правило")
  .text("Меню")
  .resized();

export const grammarPracticeKeyboard = new Keyboard()
  .text("Пропустить")
  .text("Завершить")
  .row()
  .text("Меню")
  .resized();
