import { Command, application, loadTemplate, relPath } from "../../../windcast.js";

const command = new Command(
    "Dictionary",
    "Browse Dictionary",
    async (query) => {
        application.openPage("Dictionary", "dictionnary", await loadTemplate("windcast", "persistent/_dictionary.html"))
        const word = query;
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();

        const container = document.getElementById('definitionContainer');
        container.innerHTML = '';

        if (data.title) {
            container.innerHTML = '<p>Word not found</p>';
            return;
        }

        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.textContent = data[0].word;
        wordElement.style.fontFamily = "DM Serif Display"
        container.appendChild(wordElement);

        const phoneticElement = document.createElement('div');
        phoneticElement.className = 'phonetic';
        phoneticElement.textContent = data[0].phonetic || 'No phonetic available';
        container.appendChild(phoneticElement);

        // if (data[0].phonetics[0].audio) {
        //     const audioElement = document.createElement('audio');
        //     audioElement.controls = true;
        //     audioElement.src = data[0].phonetics[0].audio;
        //     container.appendChild(audioElement);
        // }

        const originElement = document.createElement('div');
        originElement.className = 'origin';
        originElement.textContent = `Origin: ${data[0].origin || 'No origin available'}`;
        container.appendChild(originElement);

        const meaningsContainer = document.createElement('div');
        meaningsContainer.className = 'meanings';
        container.appendChild(meaningsContainer);

        data[0].meanings.forEach(meaning => {
            const meaningElement = document.createElement('div');
            meaningElement.className = 'meaning';

            const partOfSpeechElement = document.createElement('div');
            partOfSpeechElement.className = 'partOfSpeech';
            partOfSpeechElement.textContent = meaning.partOfSpeech;
            meaningElement.appendChild(partOfSpeechElement);

            meaning.definitions.forEach((definition, index) => {
                const definitionElement = document.createElement('div');
                definitionElement.className = 'definition';
                if (index == 0) {
                    definitionElement.innerHTML = `• <mark>${definition.definition}</mark>`;
                } else {
                    definitionElement.textContent = `• ${definition.definition}`;
                }
                definitionElement.style.animationDelay = `${index * 100 + 400}ms` 
                meaningElement.appendChild(definitionElement);

                if (definition.example) {
                    const exampleElement = document.createElement('div');
                    exampleElement.className = 'example';
                    exampleElement.textContent = `▪ ${definition.example}`;
                    exampleElement.style.animationDelay = `${index * 100 + 300}ms` 
                    meaningElement.appendChild(exampleElement);
                }
            });

            meaningsContainer.appendChild(meaningElement);
        });
    },
    relPath("windcast", "assets/dictionary.png"),
    [],
    []
);
export default command