const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const targetFolder = '../MultiLanguage/pc/metaverse_frontend_meta/src/lang/'; // 분석할 폴더 경로
let koreanCountsPerFolder = {};
let koreanCountsPerFile = {}; 


function incrementKoreanCount(filePath) {
  // filePath에서 폴더 경로만 추출
  const folderPath = path.dirname(filePath);
  koreanCountsPerFolder[folderPath] = (koreanCountsPerFolder[folderPath] || 0) + 1;
  koreanCountsPerFile[filePath] = (koreanCountsPerFile[filePath] || 0) + 1;
}


function findKoreanStringsAndMarkLogger(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
    });
  
    traverse(ast, {
      TemplateLiteral(path) {
          const hasKorean = path.node.quasis.some(quasi => /[가-힣]/.test(quasi.value.raw));
          if (hasKorean) {
              let message = `파일 ${filePath}에서 템플릿 리터럴 내 한글 문자열 발견: `;
              path.node.quasis.forEach((quasi, index) => {
              message += `${quasi.value.raw}${index < path.node.expressions.length ? '${...}' : ''}`;
              });
              
              // 상위 노드를 검사하여 logger.debug 또는 logger.log가 있는지 확인합니다.
              let currentPath = path;
              while (currentPath.parentPath) {
                currentPath = currentPath.parentPath;
                if (
                    currentPath.node.type === 'CallExpression' &&
                    currentPath.node.callee.object &&
                    currentPath.node.callee.object.name === 'logger' &&
                    currentPath.node.callee.property &&
                    (currentPath.node.callee.property.name === 'debug' || currentPath.node.callee.property.name === 'log' ||currentPath.node.callee.property.name === 'warn' ||currentPath.node.callee.property.name === 'error')
                ) {
                    message += " (로그)";
                    break;
                }

              }
              incrementKoreanCount(filePath);
              console.log(message);
          }
      },
      StringLiteral(path) {
        if (/[가-힣]/.test(path.node.value)) {
          let message = `파일 ${filePath}에서 한글 문자열 발견: ${path.node.value}`;
          
          // 상위 노드를 검사하여 logger.debug가 있는지 확인합니다.
          let currentPath = path;
          while (currentPath.parentPath) {
            currentPath = currentPath.parentPath;
            if (
              currentPath.node.type === 'CallExpression' &&
              currentPath.node.callee.object &&
              currentPath.node.callee.object.name === 'logger' &&
              currentPath.node.callee.property &&
              (currentPath.node.callee.property.name === 'debug' || currentPath.node.callee.property.name === 'log'  ||currentPath.node.callee.property.name === 'warn' ||currentPath.node.callee.property.name === 'error' || currentPath.node.callee.property.name === 'info')
            ) {
              message += " (로그)";
              break;
            }
          }
          incrementKoreanCount(filePath);
          console.log(message);
        }
      },
      JSXText(path) {
        if (/[가-힣]/.test(path.node.value)) {
          incrementKoreanCount(filePath);
          console.log(`파일 ${filePath}에서 JSX 내 한글 텍스트 발견: ${path.node.value}`);
        }
      },
    });

    const folderPath = path.dirname(filePath);
    koreanCountsPerFolder[folderPath] = (koreanCountsPerFolder[folderPath] || 0) + 1;
  }
  
  function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath);
      } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        findKoreanStringsAndMarkLogger(fullPath);
      }
    });
  }
  
  walkDir(targetFolder);

  console.log("\n폴더별 한글 문자열 수:");
  Object.entries(koreanCountsPerFolder).forEach(([folder, count]) => {
    console.log(`${folder.replace(path.resolve(targetFolder), '')}: ${count}개`);
  });

  // 파일별 한글 문자열 수를 출력합니다.
  console.log("\n파일별 한글 문자열 수:");
  Object.entries(koreanCountsPerFile).forEach(([file, count]) => {
    console.log(`${file.replace(path.resolve(targetFolder), '')}: ${count}개`);
  });


//../MiniProject-1/frontend/uverse_project_frontend/src/
//../MultiLanguage/pc/metaverse_frontend_meta/src/components/ui/external/