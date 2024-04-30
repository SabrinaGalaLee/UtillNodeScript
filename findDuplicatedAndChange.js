const targetJson = '../MultiLanguage/pc/metaverse_frontend_meta/src/lang/lang.ko.json'; // 분석할 lang.json 경로
const targetFolder = '../MultiLanguage/pc/metaverse_frontend_meta/src' // src 폴더 경로



const fs = require('fs').promises; // fs 모듈의 프로미스 기반 API 사용
const path = require('path');
const readline = require('readline');

const langFilePath = '../MultiLanguage/mobile/metaverse_mobile_frontend_meta/src/lang/lang.ko.json';
const searchDirectory = '../MultiLanguage/mobile/metaverse_mobile_frontend_meta/src';

// 로그 파일 경로 설정
const logDirectory = path.join(__dirname, 'logs');
const logFilePath = path.join(logDirectory, 'changes.log');

// 현재 시간을 한국 시간으로 변환하는 함수
function getKoreanTime() {
    const now = new Date();
    const timeOffsetInMS = now.getTimezoneOffset() * 60000; // 현재 지역 시간대의 시간 차이 (분)를 밀리초로 변환
    const koreaTimeOffsetInMS = 9 * 60 * 60 * 1000; // 한국은 UTC+9
    return new Date(now.getTime() + timeOffsetInMS + koreaTimeOffsetInMS).toISOString().replace('T', ' ').slice(0, 19);
}

// 로그 메시지를 파일과 콘솔에 기록하는 함수
async function logToFileAndConsole(message) {
    const timestamp = getKoreanTime();
    const logMessage = `${timestamp} - ${message}\n`;
    try {
        await fs.appendFile(logFilePath, logMessage, 'utf8');
        console.log(`${message}`.trim()); // 콘솔에도 출력
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

// 로그 디렉토리를 확인하고 필요하면 생성하는 함수
async function ensureLogDirectory() {
    try {
        await fs.mkdir(logDirectory, { recursive: true });
    } catch (err) {
        console.error('Failed to create log directory:', err);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
    });
};

// 중복된 값을 가진 키 찾기
const findDuplicateKeys = (data) => {
    const valueToKeys = {};
    Object.entries(data).forEach(([key, value]) => {
        if (!valueToKeys[value]) valueToKeys[value] = [];
        valueToKeys[value].push(key);
    });
    return Object.entries(valueToKeys).filter(([_, keys]) => keys.length > 1);
};

const replaceInFile = async (filePath, oldKeys, newKey) => {
    await ensureLogDirectory(); // 로그 디렉토리를 확인하고 필요하면 생성

    try {
        let data = await fs.readFile(filePath, 'utf8');
        let originalData = data; // 교체 전 원본 데이터를 저장
        let changedKeys = []; // 변경된 키들을 저장할 배열

        oldKeys.forEach(oldKey => {
            if (oldKey !== newKey) {
                const regexLiteral = new RegExp(`(['"\`])${oldKey}\\1`, 'g');
                const regexTransComponent = new RegExp(`(<Trans>[\\s]*?)${oldKey}([\\s]*?<\/Trans>)`, 'g');
                const regexTransComponentWithI18nKey = new RegExp(`(<Trans[\\s]+i18nKey="${oldKey}">)`, 'g');

                let tempData = data;
                data = data.replace(regexLiteral, `$1${newKey}$1`)
                            .replace(regexTransComponent, `$1${newKey}$2`)
                            .replace(regexTransComponentWithI18nKey, `<Trans i18nKey="${newKey}">`);

                if (data !== tempData) {
                    changedKeys.push(oldKey);
                }
            }
        });

        if (data !== originalData) {
            await fs.writeFile(filePath, data, 'utf8');
            if (changedKeys.length > 0) {
                const logMessage = `Changes made in ${filePath}: ${changedKeys.join(', ')} => ${newKey}`;
                await logToFileAndConsole(logMessage);
            }
        }
    } catch (err) {
        const errorMsg = `Error processing file ${filePath}: ${err}`;
        console.error(errorMsg);
        await logToFileAndConsole(errorMsg);
    }
};

// 디렉토리 순회 및 교체
const traverseAndReplace = async (directory, oldKeys, newKey) => {
    const files = await fs.readdir(directory);
    for (let file of files) {
        const fullPath = path.join(directory, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await traverseAndReplace(fullPath, oldKeys, newKey);
        } else if (/\.jsx?$/.test(fullPath)) {
            await replaceInFile(fullPath, oldKeys, newKey);
        }
    }
};

const run = async () => {
    try {
        const langData = JSON.parse(await fs.readFile(langFilePath, 'utf8'));
        const duplicates = findDuplicateKeys(langData);
      
        for (const [value, keys] of duplicates) {
            console.log(`중복 값 "${value}" 에 대한 키 목록: ${keys.join(', ')}`);
            
            let newKey = '';
            let validKey = false;

            while (!validKey) {
                newKey = await askQuestion('변경할 키를 입력하시오 (새 키 가능)(skip입력시 넘어감): ');
                if (newKey.toLowerCase() === "skip") {
                    console.log(`"${value} 값에 대한 변경은 넘어갑니다."`);
                    validKey = true;
                    continue;
                }

                if (keys.includes(newKey)) {
                    // json 목록에 있는 키 입력 => 해당 키로 모두 교체
                    console.log(`키 "${newKey}" 는 기존 중복된 키이므로 이 키를 사용하여 교체합니다.`);
                    validKey = true;
                } else if (!langData.hasOwnProperty(newKey)) {
                    // 새로운 키 입력 => json에 추가
                    langData[newKey] = value;
                    console.log(`새 키 "${newKey}" 생성됨.`);
                    validKey = true;
                } else { // 
                    console.log(`"${newKey}" 는 이미 존재하는 키입니다. 다른 키를 입력해주세요.`);
                }
            }
      
            if (newKey.toLowerCase() !== "skip") {
                keys.forEach(key => {
                    if (key !== newKey) delete langData[key];
                });
      
                await fs.writeFile(langFilePath, JSON.stringify(langData, null, 2), 'utf8');
                await traverseAndReplace(searchDirectory, keys, newKey);
            }
        }
        rl.close();
    } catch (err) {
        console.error(err);
    }
};

run().catch(err => console.error(err));