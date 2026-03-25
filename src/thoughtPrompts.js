/** Shared copy for Thought dilemma prompts (single source for Scene). */

export const DICTATOR_PROMPT = `
                  you have been given 10$ and have to decide
                  how much of it you want to split with another person. 
                  you can give all of it, none of it, or a portion of it, 
                  while the other person can only accept what has been given. 
                          
                  as the dictator, how will you distribute the coins?
                `;

export const VOLUNTEER_PROMPT = `
                  you are playing a parlor game with a few people. 
                  each person can claim either 1$ or 5$ each. 
                  if at least one person chooses 1$, 
                  then everyone will get the amount they wrote down. 
                  if no one claims 1$, then everyone gets nothing. 
                    
                  how much are you claiming?
                `;

export const EXCHANGE_PROMPT = `
                  you are playing an exchange game with another person and 
                  can keep the item you have or exchange it. 
                  when exchanging, you both have to make a decision beforehand 
                  without knowing what the other person will do. 
                  you have an apple but prefer an orange, 
                  while the other person has an orange and prefers an apple. 
                  both of you prefer obtaining both fruit to just one 
                  and prefer either fruit to none at all. 

                  knowing there’s a chance of obtaining both, one, or no fruit, 
                  do you keep your fruit, deceiving the other person, or exchange it?
                  `;

export const TRUST_PROMPT = `
                  you have been given 10$ and have to decide 
                  how much of it you want to pass to another person.
                  in the first stage, you keep the remaining amount not sent, 
                  while the receiver gains 3 times the amount sent.
                  in the second stage, the receiver may 
                  pass nothing or any portion of the money they received back to you. 
                              
                  how much are you sending?
                `;
