// アプリ全体の状態を管理

const appState = {
    messages: [],
    storyImageDataUrl: "",
};

// DOM要素をまとめて取得
const elements = {
    accountName: document.getElementById("accountName"),
    displayName: document.getElementById("displayName"),
    messageText: document.getElementById("messageText"),
    showRead: document.getElementById("showRead"),
    storyImage: document.getElementById("storyImage"),
    addMessageButton: document.getElementById("addMessageButton"),
    addStoryButton: document.getElementById("addStoryButton"),
    exportButton: document.getElementById("exportButton"),

    headerAccountName: document.getElementById("headerAccountName"),
    messageList: document.getElementById("messageList"),
    captureArea: document.getElementById("captureArea"),

    messageType: document.getElementById("messageType"),
    callDuration: document.getElementById("callDuration"),
    messageReaction: document.getElementById("messageReaction"),
};

// HTMLとして危ない文字を表示用に変換
function escapeHTML(text) {
    return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 現在選ばれている送信者を取得
function getSelectedSender() {
    const checkedInput = document.querySelector(`input[name="sender"]:checked`);
    return checkedInput ? checkedInput.value : "me";
}

// アカウント表示をプレビューに反映
function renderAccountInfo() {
    elements.headerAccountName.textContent = elements.accountName.value || "user_name";
}

// メッセージ一覧をプレビューに描画
function renderMessages() {
    const lastMyMessageIndex = findLastMyMessageIndex();

    elements.messageList.innerHTML = appState.messages
        .map((message, index) => {
            if (message.type === "story") {
                return createStoryMessageHTML(message, index, lastMyMessageIndex);
            }

            if (
                message.type === "call" ||
                message.type === "missed-call" ||
                message.type === "video-call" ||
                message.type === "missed-video-call"
            ) {
                return createCallMessageHTML(message);
            }

            return createTextMessageHTML(message, index, lastMyMessageIndex);
        })
        .join("");
}


// 役割：通話履歴メッセージHTML
function createCallMessageHTML(message) {
  const isMissed =
    message.type === "missed-call" ||
    message.type === "missed-video-call";

  const isVideo =
    message.type === "video-call" ||
    message.type === "missed-video-call";

  const icon = isVideo
    ? "fa-video"
    : "fa-phone";

  const title = isVideo
    ? "ビデオチャット"
    : "音声通話";

  return `
    <div class="message message--other">

      <div class="
        call-history
        ${isMissed ? "call-history--missed" : ""}
      ">

        <div class="call-history__icon">
          <i class="fa-solid ${icon}"></i>
        </div>

        <div class="call-history__content">
          <p class="call-history__title">
            ${title}
          </p>

          <p class="call-history__meta">
            ${
              isMissed
                ? "不在着信"
                : message.duration || "通話"
            }
          </p>
        </div>

      </div>

    </div>
  `;
}
// 最後の自分のメッセージ位置を探す
function findLastMyMessageIndex() {
    for (let index = appState.messages.length - 1; index >= 0; index--) {
        if (appState.messages[index].sender === "me") {
            return index;
        }
    }

    return -1;
}

// 通常テキストのHTMLを作成
function createTextMessageHTML(message, index, lastMessageIndex) {
    const senderClass = message.sender === "me" ? "message--me" : "message--other";
    const safeText = escapeHTML(message.text).replaceAll("\n", "<br>");
    const readHTML = createReadHTML(message, index, lastMessageIndex);

    return `
        <div class="message ${senderClass}">
            <div class="message__bubble-wrap">
                <p class="message__bubble">
                    ${safeText}
                </p>

                ${
                    message.reaction
                        ? `
                            <div class="message__reaction">
                                ${message.reaction}
                            </div>
                        `
                        : ""
                }
            </div>
            ${readHTML}
        </div>
    `;
}

// ストーリー引用風メッセージのHTMLを作成
function createStoryMessageHTML(message, index, lastMessageIndex) {
    const senderClass = message.sender === "me" ? "message--me" : "message--other";
    const readHTML = createReadHTML(message, index, lastMessageIndex);

    return `
        <div class="message ${senderClass}">
            <div class="message__story">
                <img src="${message.image}" alt="">
                <p class="message__story-text">ストーリーズに返信しました</p>
            </div>
            ${readHTML}
        </div>
    `;
}

// 既読表示のHTMLを作成
function createReadHTML(message, index, lastMessageIndex) {
    const shouldShowRead =
        elements.showRead.checked &&
        message.sender === "me" &&
        index === lastMessageIndex;

    if (!shouldShowRead) {
        return "";
    }

    return `<p class="message__read">既読・数秒前</p>`;
}

// 通常メッセージを追加
function addTextMessage() {
    const text = elements.messageText.value.trim();

    const messageType = elements.messageType.value;

    //通話系メッセージか判定
    const isCallType = 
        messageType === "call" ||
        messageType === "missed-call" ||
        messageType === "video-call" ||
        messageType === "missed-video-call";

    //通常メッセージだけ入力必須
    if (!text && !isCallType) {
        alert("メッセージを入力してね");
        return;
    }

    appState.messages.push({
        id: Date.now(),
        type: messageType,
        duration: elements.callDuration.value,
        sender: getSelectedSender(),
        text: text,
        reaction: elements.messageReaction.value,
    });

    elements.messageText.value = "";
    elements.callDuration.value = "";
    
    renderMessages();
}

// 画像ファイルをDataURLとして読み込む
function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
        reader.readAsDataURL(file);
    });
}

// ストーリー引用風メッセージを追加
async function addStoryMessage() {
    const file = elements.storyImage.files[0];

    if (!file) {
        alert("画像を選んでね");
        return;
    }

    const imageDataUrl = await readImageFile(file);

    appState.messages.push({
        id: Date.now(),
        type: "story",
        sender: getSelectedSender(),
        image: imageDataUrl,
    });

    elements.storyImage.value = "";
    renderMessages();
}

// プレビューを画像として保存
async function exportPreviewImage() {
    const canvas = await html2canvas(elements.captureArea, {
        backgroundColor: null,
        scale: 2,
    });

    const imageUrl = canvas.toDataURL("image/png");

    const downloadLink = document.createElement("a");
    downloadLink.href = imageUrl;
    downloadLink.download = "dm-screenshot.png";
    downloadLink.click();
}

// イベントをまとめて登録
function bindEvents() {
    elements.accountName.addEventListener("input", renderAccountInfo);
    elements.displayName.addEventListener("input", renderAccountInfo);

    elements.addMessageButton.addEventListener("click", addTextMessage);
    elements.addStoryButton.addEventListener("click", addStoryMessage);
    elements.exportButton.addEventListener("click", exportPreviewImage);

    elements.showRead.addEventListener("change", renderMessages);
}

// アプリ起動時の初期化
function initApp() {
    renderAccountInfo();
    renderMessages();
    bindEvents();
}

document.addEventListener("DOMContentLoaded", initApp);