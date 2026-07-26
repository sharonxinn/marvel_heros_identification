/*
 * Source: dataset/archive.zip -> marvel_characters_dataset.csv
 * Black Widow appears twice in the CSV; the duplicate row is intentionally deduplicated.
 */
(function () {
  const rows = [
    ["iron_man", "Iron Man", "Tony Stark", "Avengers", "Powered Armor, Genius-level intellect", "Hero", "Low"],
    ["captain_america", "Captain America", "Steve Rogers", "Avengers", "Super Soldier, Enhanced strength", "Hero", "Low"],
    ["thor", "Thor", "Thor Odinson", "Avengers", "God of Thunder, Weather manipulation", "Hero", "Low"],
    ["black_widow", "Black Widow", "Natasha Romanoff", "Avengers", "Superhuman strength, Espionage", "Hero", "Low"],
    ["hulk", "Hulk", "Bruce Banner", "Avengers", "Superhuman strength, Gamma Radiation", "Hero", "Low"],
    ["spider_man", "Spider-Man", "Peter Parker", "Avengers", "Spider sense, Wall crawling", "Hero", "Low"],
    ["wolverine", "Wolverine", "James Howlett", "X-Men", "Regeneration, Adamantium claws", "Hero", "Low"],
    ["deadpool", "Deadpool", "Wade Wilson", "X-Force", "Regeneration, Skilled hand-to-hand combatant", "Antihero", "Low"],
    ["black_panther", "Black Panther", "T’Challa", "Avengers", "Superhuman strength, Vibranium suit", "Hero", "Low"],
    ["doctor_strange", "Doctor Strange", "Stephen Strange", "Avengers", "Sorcery, Magic", "Hero", "Low"],
    ["ant_man", "Ant-Man", "Scott Lang", "Avengers", "Size manipulation, Ant communication", "Hero", "Low"],
    ["scarlet_witch", "Scarlet Witch", "Wanda Maximoff", "Avengers", "Telekinesis, Reality warping", "Hero", "Low"],
    ["vision", "Vision", "Victor Von Doom", "Avengers", "Genius intellect, Magic", "Hero", "Low"],
    ["daredevil", "Daredevil", "Matt Murdock", "Defenders", "Enhanced senses, Superhuman strength", "Hero", "Low"],
    ["luke_cage", "Luke Cage", "Carl Lucas", "Defenders", "Superhuman strength, Bulletproof skin", "Hero", "Low"],
    ["gamora", "Gamora", "Gamora Zenwhoberi", "Guardians of the Galaxy", "Superhuman strength, Expert fighter", "Hero", "Low"],
    ["star_lord", "Star-Lord", "Peter Quill", "Guardians of the Galaxy", "Weapons expert, Green energy manipulation", "Hero", "Low"],
    ["rocket_raccoon", "Rocket Raccoon", "Rocket", "Guardians of the Galaxy", "Cybernetic enhancements", "Hero", "Low"],
    ["thanos", "Thanos", "Thanos", "Villain", "Expert marksmanship, Advanced technology", "Villain", "Low"],
    ["doctor_doom", "Doctor Doom", "Victor Von Doom", "Villain", "Superhuman strength, Regeneration", "Villain", "Low"],
    ["green_goblin", "Green Goblin", "Norman Osborn", "Villain", "Magical powers", "Villain", "Low"],
    ["loki", "Loki", "Loki Laufeyson", "Avengers", "Superhuman speed, Enhanced senses", "Hero", "Low"],
    ["hawkeye", "Hawkeye", "Clint Barton", "Avengers", "Aerial combat, Shield mastery", "Hero", "Low"],
    ["bucky_barnes", "Bucky Barnes", "James Buchanan Barnes", "Avengers", "Superhuman strength, Regeneration", "Hero", "Low"],
    ["falcon", "Falcon", "Sam Wilson", "Avengers", "Chi manipulation, Martial arts expert", "Hero", "Low"],
    ["shang_chi", "Shang-Chi", "Shang-Chi", "Avengers", "Skilled combatant, Weapon mastery", "Hero", "Low"],
    ["moon_knight", "Moon Knight", "Marc Spector", "Avengers", "Energy manipulation, Expert marksman", "Hero", "Low"],
    ["elektra", "Elektra", "Elektra Natchios", "Defenders", "Skilled combatant, Enhanced reflexes", "Hero", "Low"],
    ["mantis", "Mantis", "Mantis", "Avengers", "Superhuman strength, Agility", "Hero", "Low"],
    ["valkyrie", "Valkyrie", "Brunnhilde", "Defenders", "Superhuman intelligence, Tentacle control", "Hero", "Low"],
    ["black_bolt", "Black Bolt", "Blackagar Boltagon", "Avengers", "Illusion creation, Hypnosis", "Hero", "Low"],
    ["silver_surfer", "Silver Surfer", "Norrin Radd", "Inhumans", "Superhuman strength, Durability", "Hero", "Low"],
    ["red_skull", "Red Skull", "Johann Schmidt", "Fantastic Four", "Symbiote bonding, Enhanced strength", "Villain", "Low"],
    ["ultron", "Ultron", "Henry Pym", "Hydra", "Flight, Superhuman strength, Cosmic energy", "Villain", "Low"],
    ["hela", "Hela", "Sue Storm", "Avengers", "Magical powers", "Villain", "Low"],
    ["mister_fantastic", "Mister Fantastic", "Johnny Storm", "Fantastic Four", "Elasticity, Superhuman strength", "Hero", "Low"],
    ["invisible_woman", "Invisible Woman", "Ben Grimm", "Fantastic Four", "Invisibility, Force field generation", "Hero", "Low"],
    ["human_torch", "Human Torch", "Otto Octavius", "Fantastic Four", "Pyrokinesis, Flight", "Hero", "Low"],
    ["thing", "Thing", "Quentin Beck", "Sinister Six", "Superhuman strength, Durability", "Hero", "Low"],
    ["doctor_octopus", "Doctor Octopus", "Mac Gargan", "Sinister Six", "Superhuman strength, Tentacle control", "Hero", "Low"],
    ["mysterio", "Mysterio", "Eddie Brock", "Sinister Six", "Illusion creation, Hypnosis", "Villain", "Low"],
    ["rhino", "Rhino", "Carol Danvers", "Sinister Six", "Superhuman strength, Durability", "Hero", "Low"],
    ["venom", "Venom", "Eddie Brock", "Avengers", "Symbiote bonding, Enhanced strength", "Antihero", "Low"],
    ["captain_marvel", "Captain Marvel", "Carol Danvers", "Avengers", "Flight, Superhuman strength, Cosmic energy", "Hero", "Low"],
  ];

  const portraitClass = {
    iron_man: "iron",
    captain_america: "captain",
    thor: "thor",
    black_widow: "widow",
    spider_man: "spider",
    black_panther: "panther",
    doctor_strange: "strange",
    loki: "loki",
    scarlet_witch: "scarlet",
    hulk: "hulk",
    moon_knight: "moon",
    black_bolt: "bolt",
    ant_man: "antman",
    vision: "vision",
    star_lord: "starlord",
    captain_marvel: "captain-marvel",
    venom: "venom",
  };
  const roleGlow = {
    Hero: "rgba(82, 155, 255, .36)",
    Antihero: "rgba(196, 85, 67, .38)",
    Villain: "rgba(238, 61, 73, .40)",
  };

  window.HERO_PROFILES = Object.freeze(rows.map(([id, character, realName, affiliation, powers, role, powerLevel]) => {
    const traits = powers.split(",").map(power => power.trim());
    return Object.freeze({
      id,
      name: character.toUpperCase(),
      alias: realName.toUpperCase(),
      affiliation,
      role,
      powerLevel,
      type: affiliation.toUpperCase(),
      short: `${role} / ${affiliation}. Listed abilities: ${traits.slice(0, 2).join(" + ")}.`,
      story: `${character} is recorded in the supplied Marvel character dataset as a ${role.toLowerCase()} affiliated with ${affiliation}. This profile lists ${powers.toLowerCase()} and assigns a ${powerLevel.toLowerCase()} power level.`,
      traits: [role, ...traits, `${powerLevel} power level`],
      className: portraitClass[id] || "generic",
      glow: roleGlow[role],
    });
  }));
}());
