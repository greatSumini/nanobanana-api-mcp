# Nanobanana MCP - Blueprint

## 개요

Google Gemini API를 사용하여 이미지를 생성하고 편집하는 MCP(Model Context Protocol) 서버입니다.

## 핵심 기능

### 1. generate_image
- **설명**: 텍스트 프롬프트를 기반으로 이미지를 생성합니다.
- **입력 파라미터**:
  - `prompt` (string, 필수): 생성할 이미지에 대한 텍스트 설명
  - `output_path` (string, 필수): 생성된 이미지를 저장할 **절대 경로** (루트부터 시작하는 전체 파일 시스템 경로)
    - 예시: `/Users/username/images/output.png` 또는 `C:\Users\username\images\output.png`
    - 상대 경로는 허용되지 않습니다
  - `model` (enum, 선택): 사용할 모델 - "pro" (기본값) 또는 "normal" (CLI에서 --model이 제공된 경우 이 파라미터는 툴에서 숨겨짐)
    - `pro`: gemini-3-pro-image-preview (고품질)
    - `normal`: gemini-2.5-flash-image (빠른 속도)
  - `reference_images_path` (string[], 선택): 생성을 가이드할 참조 이미지의 **절대 경로** 배열
    - 각 경로는 반드시 절대 경로여야 합니다
    - 예시: `['/Users/username/images/ref1.png', '/Users/username/images/ref2.png']`
    - 상대 경로는 허용되지 않습니다

### 2. edit_image
- **설명**: 텍스트 프롬프트를 기반으로 기존 이미지를 편집합니다.
- **입력 파라미터**:
  - `path` (string, 필수): 편집할 이미지의 **절대 경로** (루트부터 시작하는 전체 파일 시스템 경로)
    - 예시: `/Users/username/images/input.png` 또는 `C:\Users\username\images\input.png`
    - 상대 경로는 허용되지 않습니다
  - `prompt` (string, 필수): 수행할 편집에 대한 텍스트 설명
  - `output_path` (string, 선택): 편집된 이미지를 저장할 **절대 경로** (기본값: `path`와 동일)
    - 예시: `/Users/username/images/output.png` 또는 `C:\Users\username\images\output.png`
    - 상대 경로는 허용되지 않습니다
  - `model` (enum, 선택): 사용할 모델 - "pro" (기본값) 또는 "normal" (CLI에서 --model이 제공된 경우 이 파라미터는 툴에서 숨겨짐)
    - `pro`: gemini-3-pro-image-preview (고품질)
    - `normal`: gemini-2.5-flash-image (빠른 속도)
  - `reference_images_path` (string[], 선택): 편집을 가이드할 추가 참조 이미지의 **절대 경로** 배열
    - 각 경로는 반드시 절대 경로여야 합니다
    - 예시: `['/Users/username/images/ref1.png', '/Users/username/images/ref2.png']`
    - 상대 경로는 허용되지 않습니다

## 아키텍처

### 모듈 구조

```
src/
├── services/
│   └── image-generator.ts    # Google Gemini API를 사용한 이미지 생성/편집 서비스
├── tools/
│   ├── generate-image.ts     # generate_image MCP 툴 구현
│   └── edit-image.ts         # edit_image MCP 툴 구현
├── types/
│   └── index.ts              # TypeScript 타입 정의
└── server.ts                 # MCP 서버 설정 및 구성
```

### 주요 의존성

- `@google/genai`: Google Generative AI SDK
- `@modelcontextprotocol/sdk`: MCP SDK
- `zod`: 스키마 검증
- `commander`: CLI 인자 파싱

## API 키 구성

Google API 키는 다음 방법으로 제공할 수 있습니다:
1. CLI 인자: `--apiKey` (권장)
2. 환경 변수: `GOOGLE_API_KEY`

## CLI 옵션

- `--apiKey <key>`: Google API 키 (또는 GOOGLE_API_KEY 환경 변수 사용)
- `--model <pro|normal>`: 모든 작업에 사용할 고정 모델 (선택사항, 지정 시 툴 파라미터에서 model 숨김)
- `--transport <stdio|http>`: 전송 타입 (기본값: stdio)
- `--port <number>`: HTTP 전송 포트 (기본값: 5000)

## 실행 방법

```bash
# CLI 인자로 API 키 제공 (권장)
nanobanana-mcp --apiKey "your-api-key-here"

# 환경 변수 사용
export GOOGLE_API_KEY="your-api-key-here"
nanobanana-mcp

# 모델 고정
nanobanana-mcp --apiKey "your-api-key-here" --model pro

# HTTP 전송 모드
nanobanana-mcp --apiKey "your-api-key-here" --transport http --port 5000
```

## MCP 클라이언트 설정 예시

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "npx",
      "args": ["-y", "nanobanana-mcp", "--apiKey", "your-api-key-here"]
    }
  }
}
```

모델을 고정하려면:

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "npx",
      "args": ["-y", "nanobanana-mcp", "--apiKey", "your-api-key-here", "--model", "pro"]
    }
  }
}
```

## 지원 이미지 형식

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## 구현 세부사항

### ImageGenerator 서비스

`ImageGenerator` 클래스는 Google Gemini API와의 모든 상호작용을 처리합니다:

1. **generateImage**: 프롬프트와 선택적 참조 이미지를 기반으로 새 이미지 생성
2. **editImage**: 프롬프트를 기반으로 기존 이미지 편집
3. **readImageAsBase64**: 이미지 파일을 base64로 읽기
4. **getMimeType**: 파일 확장자를 기반으로 MIME 타입 결정

### MCP 툴

각 툴은 다음을 포함합니다:
- Zod 스키마를 사용한 입력 검증
- ImageGenerator 서비스를 사용한 비즈니스 로직
- 적절한 에러 처리

## 개발 가이드

### 환경 설정

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 타입 체크

```bash
npm run typecheck
```

### 린트

```bash
npm run lint
```

### 테스트

```bash
npm test
```

## 배포

### NPM 배포

```bash
npm publish
```

### Docker 배포

```bash
docker build -t nanobanana-mcp .
docker run -d -p 5000:5000 --env GOOGLE_API_KEY="your-api-key" nanobanana-mcp
```
