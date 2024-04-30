const targetFolder = '../MultiLanguage/mobile/metaverse_mobile_frontend_meta/src/lang/lang.ko.json'; // 분석할 폴더 경로
const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// lang.json 파일 경로
const langFilePath =targetFolder;
// 검사할 파일들의 경로
const filesToCheck = ['path/to/your/file1.js', 'path/to/your/file2.js'];

// 중복된 값을 찾는 함수
function findDuplicates() {
    const langData = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
    const valueMap = {};
    
    for (const [key, value] of Object.entries(langData)) {
        if (!valueMap[value]) {
            valueMap[value] = [];
        }
        valueMap[value].push(key);
    }

    return Object.entries(valueMap).filter(([_value, keys]) => keys.length > 1);
}

// 특정 키가 사용된 위치를 찾아서 변경하는 함수
function findAndReplaceKeyUsage(key, newValue) {
    filesToCheck.forEach(file => {
        let fileContent = fs.readFileSync(file, 'utf8');

        // 키값이 포함된 줄을 찾아서 새 값으로 변경
        const regex = new RegExp(`"${key}":\\s*".*?"`, 'g');
        fileContent = fileContent.replace(regex, `"${key}": "${newValue}"`);

        // 파일에 변경사항 저장
        fs.writeFileSync(file, fileContent, 'utf8');
        console.log(`${file} 내에서 ${key}의 값이 "${newValue}"(으)로 변경되었습니다.`);
    });
}

// 중복된 값과 해당 키 출력 후 사용자 입력 받기
const duplicates = findDuplicates();
console.log("Duplicate values and their keys:");
duplicates.forEach(([value, keys], index) => {
    console.log(`${index + 1}. Value: "${value}" has the following keys: ${keys.join(', ')}`);
});

// rl.question('변경할 키의 번호를 입력하세요: ', index => {
//     const selectedDup = duplicates[index - 1];
//     if (!selectedDup) {
//         console.log('잘못된 선택입니다.');
//         rl.close();
//         return;
//     }

//     rl.question('새 값을 입력하세요: ', newValue => {
//         selectedDup[1].forEach(key => {
//             findAndReplaceKeyUsage(key, newValue);
//         });
//         rl.close();
//     });
// });
