
// 파일 경로
const inputFile = '../MultiLanguage/pc/metaverse_frontend_meta/src/lang/lang.ko.json';
const outputFile = '../MultiLanguage/pc/metaverse_frontend_meta/src/lang/lang.en.json';
// deepl-node 라이브러리와 필요한 모듈을 임포트합니다.
const deepl = require('deepl-node');
const fs = require('fs');
const readline = require('readline');

// Deepl 인증 키를 입력하세요.
const authKey = "a691e3ce-bd90-4494-8b01-59452e3600ea:fx"; 
const translator = new deepl.Translator(authKey);

// 파일 로드 및 저장 함수
const filePath = outputFile;
let translatedData = {};

const loadData = () => {
  if (fs.existsSync(filePath)) {
    translatedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
};

const saveToFile = () => {
  fs.writeFileSync(filePath, JSON.stringify(translatedData, null, 2), 'utf8');
};

// readline 인터페이스를 설정합니다.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 각 키를 순차적으로 처리합니다.
const translateKeys = async () => {
  loadData(); // 파일에서 기존 번역 데이터를 로드합니다.

  for (const [key, value] of Object.entries(JSON.parse(fs.readFileSync(inputFile, 'utf8')))) {
    if (key in translatedData) {
      continue; // 이미 번역된 키는 건너뜁니다.
    }

    const answer = await new Promise(resolve => {
      rl.question(`Translate "${value}"? (Press Enter to translate or type "skip" to keep original): `, resolve);
    });

    if (answer.toLowerCase() === 'skip') {
      translatedData[key] = value;
    } else {
      try {
        const result = await translator.translateText(value, null, 'EN-US');
        translatedData[key] = result.text;
      } catch (error) {
        console.error('Error during translation:', error);
        translatedData[key] = value;
      }
    }

    saveToFile(); // 번역 후 즉시 파일에 저장합니다.
  }

  rl.close();
  console.log('Translation completed and all changes saved to lang.en.json');
};

// 번역 함수를 실행합니다.
translateKeys();