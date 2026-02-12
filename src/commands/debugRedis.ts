import { Context } from "grammy";

import { SessionRepository } from "@domain/session-repository";
import { ExerciseType } from "@domain/session-types";

/**
 * Команда /debug_redis для отладки текущей сессии в Redis
 * Выводит информацию о сессии практики, упражнениях и результатах
 */
export function createDebugRedisCommand(sessionRepository: SessionRepository) {
	return async (ctx: Context): Promise<void> => {
		const userId = ctx.from?.id;
		if (!userId) {
			await ctx.reply("Ошибка: не удалось определить пользователя");
			return;
		}

		try {
			const session = await sessionRepository.getSession(userId);

			if (!session) {
				await ctx.reply("❌ Нет активной сессии в Redis");
				return;
			}

			// Форматируем информацию о сессии
			const lines: string[] = [
				"📊 <b>Redis Session Info</b>\n",
				`Session ID: <code>${session.sessionId}</code>`,
				`Grammar Rule: <b>${session.grammarRule}</b>`,
				`Level: ${session.level}`,
				`\n📈 <b>Progress</b>`,
				`Current Exercise: ${session.currentExerciseIndex + 1}/${session.exercises.length}`,
				`Correct Answers: ${session.correct}/${session.total}`,
				`Accuracy: ${session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0}%`,
			];

			// Информация о текущем упражнении
			if (session.currentExerciseIndex < session.exercises.length) {
				const currentExercise = session.exercises[session.currentExerciseIndex];
				lines.push(
					`\n❓ <b>Current Exercise</b>`,
					`ID: <code>${currentExercise.id}</code>`,
					`Type: ${currentExercise.type === ExerciseType.SINGLE_CHOICE ? "Single Choice" : "Fill in Blank"}`,
					`Question: ${currentExercise.question.substring(0, 50)}${currentExercise.question.length > 50 ? "..." : ""}`,
					`Status: Not answered`
				);
			} else {
				lines.push(`\n❓ <b>Current Exercise</b>`, `Status: All exercises completed ✅`);
			}

			// Информация об ответанных упражнениях
			const answeredExercises = session.exercises.filter((e) => e.userAnswer !== undefined);
			if (answeredExercises.length > 0) {
				lines.push(`\n📝 <b>Answered Exercises (${answeredExercises.length})</b>`);
				answeredExercises.forEach((exercise, index) => {
					const icon = exercise.isCorrect ? "✅" : "❌";
					lines.push(
						`${index + 1}. ${icon} ${exercise.question.substring(0, 40)}${exercise.question.length > 40 ? "..." : ""}`
					);
					lines.push(`   Your answer: <code>${exercise.userAnswer}</code>`);
					lines.push(`   Correct answer: <code>${exercise.correctAnswer}</code>`);
				});
			}

			// Информация о времени
			lines.push(`\n⏱️ <b>Time Info</b>`, `Started: ${session.startTime.toLocaleString()}`);
			if (session.endTime) {
				lines.push(`Ended: ${session.endTime.toLocaleString()}`);
			}

			await ctx.reply(lines.join("\n"), {
				parse_mode: "HTML",
			});
		} catch (error) {
			console.error(`[DebugRedis] Error for user ${userId}:`, error);
			await ctx.reply("❌ Ошибка при получении информации из Redis", { parse_mode: "HTML" });
		}
	};
}
