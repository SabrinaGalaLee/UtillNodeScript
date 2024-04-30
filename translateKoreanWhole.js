const inputFile = '../MultiLanguage/mobile/metaverse_mobile_frontend_meta/src/lang/lang.ko.json';
const outputFile = '../MultiLanguage/mobile/metaverse_mobile_frontend_meta/src/lang/lang.en.json';

// deepl-node 라이브러리를 임포트합니다.
const deepl = require('deepl-node');
const fs = require('fs');

// Deepl 인증 키를 입력하세요.
const authKey = "a691e3ce-bd90-4494-8b01-59452e3600ea:fx"; 
const translator = new deepl.Translator(authKey);

// 원본 JSON 파일을 로드합니다.
const originalData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const translatedData = {};

// 각 키와 값을 번역합니다.
const translateKeys = async () => {
  for (const [key, value] of Object.entries(originalData)) {
    const result = await translator.translateText(value, null, 'EN-US');
    console.log(`[${key}] translate to ${result.text}`);
    translatedData[key] = result.text;
  }

  // 번역된 데이터를 새 파일에 저장합니다.
  fs.writeFileSync(outputFile, JSON.stringify(translatedData, null, 2), 'utf8');
  console.log('Translation completed and saved to lang.en.json');
};

// 번역 함수를 실행합니다.
translateKeys().catch(error => {
    console.error('Error during translation:', error);
});
