/**
 * Canned lines for the Guess the Spy bot.
 *
 * Locations are configurable in the database, so a bot cannot carry a script per
 * location. Everything here works for any location: questions are the generic
 * Spyfall kind, and answers are built from the two things a bot always knows —
 * its own role and the location's category. A non-spy bot must never name the
 * location (that is against the rules of the game), and a spy bot does not know
 * it, so no template references it.
 */

export const SPY_BOT_QUESTIONS: readonly string[] = [
  'How often do you end up here?',
  'Would you bring a child along to this place?',
  'What time of day is it busiest here?',
  'Do you need any training to be here?',
  'How would you dress for this place?',
  'What is the first thing you notice when you arrive?',
  'Is there anywhere here you would rather not go?',
  'Would you come back tomorrow if you could?',
  'How long do people usually stay?',
  'Do you have to pay to be here?',
  'Is it loud where you are standing?',
  'What is the smell like here?',
  'Would you feel safe here at night?',
  'Do you know most of the people around you?',
  'What would you complain about first?',
] as const

/** Answers a bot who knows the location can give, flavoured by its role. */
export const SPY_BOT_INSIDER_ANSWERS: readonly string[] = [
  'Comes with being the {role}, so more often than most.',
  'As the {role} I barely notice it any more.',
  'Depends on the shift — the {role} sees the quiet hours too.',
  'Everyone asks the {role} that. Honestly, it varies.',
  'Not the part of being the {role} I would brag about.',
  'The {role} gets the best view of it, I will say that.',
  'Ask me again in an hour, the {role} never gets a straight day.',
  'Fine by me. Then again, the {role} is used to it.',
] as const

/**
 * A spy has to answer without knowing where they are, so these commit to
 * nothing and lean on whatever the previous speakers established.
 */
export const SPY_BOT_BLUFF_ANSWERS: readonly string[] = [
  'About as much as anyone else here, I would guess.',
  'Depends on the day, really.',
  'Same as the last person, more or less.',
  'I try not to think about it too hard.',
  'Enough to have an opinion, not enough to argue about it.',
  'Could go either way. What made you ask me?',
  'Less than you would expect, honestly.',
  'That is a strange one to ask me of all people.',
] as const
