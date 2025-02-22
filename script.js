//ギャラリーの全画像
let allGalleryImages=[];

//urlにある記事内のtoGクラスが付与されている画像を取得
//画像を元に、タイトル、リンク、caption、本文を取得
async function getImagesContents_setImagesToDOM(url){
	//urlから記事を取得
	const parser = new DOMParser();
	const response = await fetch(url);
	if (!response.ok) throw new Error("ページ取得失敗");
	const text = await response.text();
	const doc = parser.parseFromString(text,"text/html");
	const articles = doc.querySelectorAll(".entry");
	//記事の本文
	let contents=[];
	//記事の画像
	let toSlideImages =[];
	let toGalleryImages =[];
	articles.forEach(article =>{
		const title = article.querySelector(".entry-title")?.textContent.trim();
		const articleURL = article.querySelector(".entry-title a")?.href; //記事のURLを取得
		const toSFigures = article.querySelectorAll(".toS"); //toSクラスを付けたfigureを全て取得→Slideへ
		const toGFigures = article.querySelectorAll(".toG"); //toGクラスを付けたfigureを全て取得→Galleryへ
		const contentElement = article.querySelector(".entry-content");
		// <figure> を除いた本文を取得
		let contentText = "";
		if (contentElement) {
			const clone = contentElement.cloneNode(true); // クローンを作成
			clone.querySelectorAll("figure").forEach(fig => fig.remove()); // figureタグを削除
			contentText = clone.textContent.trim(); // クローンからテキストを取得
		}
		//スライドへ追加するfigureがあれば
		if(toSFigures){
			toSFigures.forEach(figure=>{
				const img = figure ? figure.querySelector("img") : null;
				const caption = figure ? figure.querySelector("figcaption") : null;
				if (img && caption){
					//画像情報
					const image={title:title,imgSrc:img.src,caption:caption.textContent.trim(),url:articleURL}
					toSlideImages.push(image);
					//本文を追加
					contents.push(contentText);
				};
			})
		}
		//ギャラリーに追加するfigureがあれば
		if(toGFigures){
			toGFigures.forEach(figure=>{
				const img = figure ? figure.querySelector("img") : null;
				const caption = figure ? figure.querySelector("figcaption") : null;
				if (img && caption){
					//画像情報
					const image={title:title,imgSrc:img.src,caption:caption.textContent.trim(),url:articleURL}
					toGalleryImages.push(image);
					//本文を追加
					contents.push(contentText);
				};
			});
		}
	});
	//スライドに追加する画像リストがあれば
	if (toSlideImages){
		toSlideImages.forEach(image=>{
			const div = document.createElement("div");
			div.innerHTML = `
				<a>
					<img class="slide-image" src="${image.imgSrc}" alt="${image.caption}">
				</a>
				<div class="image-figcaption">${image.caption}</div>
			`;
			slideContainerElement.appendChild(div);
			slideElement.appendChild(slideContainerElement);
		});
	}
	//ギャラリーに追加する画像リストがあれば
	if(toGalleryImages){
		toGalleryImages.forEach(image=>{
			//modal切替用にpush
			allGalleryImages.push(image);
			const div = document.createElement("div");
			div.innerHTML = `
				<a href="${image.url}" target="_blank">
					<img src="${image.imgSrc}" alt="${image.caption}">
				</a>
				<div class="image-figcaption">${image.caption}</div>
			`;
			galleryContainerElement.appendChild(div);
			galleryElement.appendChild(galleryContainerElement);
			// ギャラリー画像をクリックしたときのイベント
			div.querySelector("a").addEventListener("click", (e) => {
				e.preventDefault(); // 既定のリンク動作を防ぐ
				openModal(image);
			});
		});
	}
	// 次のページのURLを取得
	const nextPageLink = doc.querySelector(".pager-next a");
	//次ページリンクがあれば再実行
	if (nextPageLink) {
		const nextPageUrl = nextPageLink.href;
		await getImagesContents_setImagesToDOM(nextPageUrl);
	}
	//全部取得した
	//本文を「。」ごとに区切って配列にする
	const phrases = createPhrases(contents);
	//phrasesを画面に表示して、終了後画像表示へ切替
	showContents(phrases);
};

//設定
const mainURL = "https://kotobarokou.hatenablog.com";
const titleTexts = [
	"私たちは何かを考え、理解しようとする時、言葉を使う。\n私たちは、言語を持たない写真を、私たちの唯一の武器である言葉を用いて理解しようとする。",
	"私たちは、写真の果てしない奥深さに途方に暮れることがある。\nそれでも私たちは、理解できないものを理解できないままにしておくことができない。\n考えることをやめられない。考えずにはいられないのだ。",
	"ひたすらにファインダーを覗き、シャッターを切る行為に夢中になる。\nそれはなぜなのか、明確にはわからない。わからないからこそ夢中になれるのかもしれない。",
	"世界は、言い表しようのない感情や、言葉では説明しきれない事象で満ち溢れている。\n私はこれらを写真を通して腑に落ちるまでできるだけ言語化し理解したい。",
	"花を愛でるように、暖かな詩を詠むように、我が子を抱き上げるように、写真とは何かを考える。",
	"この苦しい苦しい営みは、写真の本質を問い、時に暴く。",
	"写真を撮ることは、世界を理解しようとする、優しく、力強い営みだ。"
];

//DOM Elements
let slideElement;
let slideContainerElement;
let galleryElement;
let galleryContainerElement;
let phraseElement;
let titleElement;
let verticalTitle;
let modal;
let modalContent;
let modalImage;
let modalImageLink;
let modalLink;
let closeModalButton;

function setElementDefaultHide(element,innerHtmlText){
	// 最初は非表示＆透明
	element.style.display = "none";
	element.style.opacity = "0";
	element.innerHTML = innerHtmlText; // 初期化
}
document.addEventListener("DOMContentLoaded", () => {
	// ページロード時に画面を一番上にスクロール
    window.scrollTo(0, 0);
	slideElement = document.getElementById("slide");
	slideContainerElement = document.getElementById("slide-container");
	// 最初は非表示＆透明
	setElementDefaultHide(slideElement,"");

	galleryElement = document.getElementById("gallery");
	galleryContainerElement = document.getElementById("gallery-container");
	// 最初は非表示＆透明
	setElementDefaultHide(galleryElement,"");

	phraseElement = document.getElementById("phrase");

	titleElement = document.getElementById("title");
	const randomTitleText = titleTexts[Math.floor(Math.random() * titleTexts.length)];
	//const randomTitleText = titleTexts[Math.floor(Math.random() * titleTexts.length)];
	setElementDefaultHide(titleElement,randomTitleText);
	//縦タイトル
	verticalTitle = document.getElementById("vertical-title");

	modal = document.getElementById("modal");
	modalContent=modal.querySelector(".modal-content");
	modalImage =document.querySelector(".modal-image");
	modalImageLink = document.querySelector(".modal-image-link");
	modalLink = document.querySelector(".modal-link");
	closeModalButton = document.querySelector(".modal-close");

	// 右クリックを無効化
	document.addEventListener("contextmenu", function (event) {
		event.preventDefault();
	});
	// 画像をタッチして保存できないようにする
	document.addEventListener("touchstart",function (event) {
		if (event.target.tagName === "IMG") {
			//event.preventDefault();
		}},{ passive: false }
	);
	getImagesContents_setImagesToDOM(mainURL);
	//ギャラリーのタイトル要素を追加
	const titleDiv = document.createElement("div");
	titleDiv.classList.add("gallery-title");
	titleDiv.innerHTML=`Gallery`;
	gallery.appendChild(titleDiv)
	//縦タイトルをgalleryの半分までスクロールしたら隠れる
	window.addEventListener("scroll", function () {
		// gallery要素の位置を取得
		let galleryTop = gallery.getBoundingClientRect().top;
		// galleryがビューポートに入ったらタイトルを隠す
		let galleryHeight = gallery.offsetHeight;
		// galleryの半分がビューポートに入った時にタイトルを隠す
		if (galleryTop + galleryHeight / 2 <= window.innerHeight) {
			verticalTitle.classList.add("hidden");
		} else {
			verticalTitle.classList.remove("hidden");
		}
	});
});

//フレーズ作成
function createPhrases(contents) {
	let phrases=[];
	contents.forEach(content => {
		// 句点（。）で区切り、空でない要素を `phrases` 配列に追加
		const splitPhrases = content.split("。").map(s => s.trim()).filter(s => s);
		phrases.push(...splitPhrases);
	});
	// 配列をランダムにシャッフル
	phrases = phrases.sort(() => Math.random() - 0.5);
	return phrases;
}
//フレーズ表示→タイトル表示→フレーズ非表示→タイトル非表示→スライド表示→ギャラリー表示
async function showContents(phrases) {
	phraseElement.textContent = ""; // 既存のフレーズをリセット
	// Setで重複を排除
	const uniquePhrases = [...new Set(phrases)];
	// フレーズをランダムにシャッフル
	uniquePhrases.sort(() => Math.random() - 0.5);
	// シャッフルされたフレーズを順番に表示
	for (let phrase of uniquePhrases) {
		phraseElement.textContent += phrase + " ";  // フレーズを追加
		// オーバーフローのチェック
		if (phraseElement.scrollHeight > phraseElement.clientHeight) {
			//タイトルを表示
			//await showElement(titleElement);
			//フレーズを非表示
			await hideElement(phraseElement);
			//タイトルを非表示 少し待ってから
			//await new Promise(resolve => setTimeout(resolve, 1000));
			//await hideElement(titleElement);
			//スライドを表示
			await showElement(slideElement);
			//スライドを表示
			showSlide(0);
			//ギャラリーを表示
			await showElement(galleryElement);
			return;
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}
}
//要素を表示する
async function showElement(element){
	// フェードイン処理
	element.style.display = ""; // 表示
	await new Promise(resolve => setTimeout(resolve, 500));
	element.style.transition = "opacity 1.5s ease-in-out";
	element.style.opacity = "1";
}
//要素を非表示にする
async function hideElement(element){
    // フェードアウト処理
    element.style.transition = "opacity 1.5s ease-in-out"; // トランジションを設定
    element.style.opacity = "0";  // 透明にする
    // オーバーフローをチェックしてから visibility を変更
    await new Promise(resolve => setTimeout(resolve, 1500)); // トランジションの時間を待つ
    element.style.visibility = "hidden";  // 透明になった後で非表示にする
}



let currentSlideIndex = 0;

// スライドの表示・非表示を管理する関数
function showSlide(index) {
	const slides = document.querySelectorAll(".slide-image");
	if (index >= slides.length) currentSlideIndex = 0;  // もし最後のスライドを超えたら最初に戻る
	if (index < 0) currentSlideIndex = slides.length - 1;  // もし最初のスライドより前にいったら最後に戻る
	slides.forEach((slide, i) => {
		slide.classList.remove("active"); // すべてのスライドからactiveクラスを削除
	});
	slides[currentSlideIndex].classList.add("active"); // 現在のスライドにactiveクラスを追加
}
// 10秒ごとに次のスライドに切り替え
setInterval(() => {
	currentSlideIndex++;
	showSlide(currentSlideIndex);
}, 30000);  // 10000ミリ秒 = 10秒

// タップ時の誤動作を防ぐためのスワイプ時の処理を実行しない最小距離
const minimumDistance = 100
// スワイプ開始時の座標
let startX = 0
// スワイプ終了時の座標
let endX = 0
//現在開いているモーダル画像のindex
let currentModalIndex;

// モーダルを開く
function openModal(image) {
	currentModalIndex = allGalleryImages.findIndex(img => img.imgSrc === image.imgSrc);
	console.log('>openModal/currenModalIndex:', currentModalIndex);  // インデックスを確認
	// 閉じるボタンのイベントリスナー
	closeModalButton.addEventListener("click", closeModal);
	modal.style.display = "block"; // まず display を block にしてアニメーションを有効化
	setTimeout(() => {
		modal.classList.add("show"); // フェードイン開始
	}, 10);
	modalImage.src = image.imgSrc;
	modalImageLink.href=image.url;
	modalLink.href = image.url;
	modalLink.innerHTML = image.title;//+"<br><br>記事を見る";
	// 既存のイベントリスナーを削除してから追加（重複を防ぐ）
	modal.removeEventListener("touchstart", handleTouchStart);
	modal.removeEventListener("touchend", handleTouchEnd);
	modal.addEventListener("touchstart", handleTouchStart);
	modal.addEventListener("touchend", handleTouchEnd);
}
// スワイプ開始時の座標を取得
function handleTouchStart(e) {
	startX = e.touches[0].pageX;
}
// スワイプ終了時の座標を取得し、スワイプ方向を判定
function handleTouchEnd(e) {
	endX = e.changedTouches[0].pageX;
	const distanceX = endX - startX;
	// 最小距離を超えている場合のみスワイプを認識
	if (Math.abs(distanceX) > minimumDistance) {
		if (distanceX < 0) {
			// 左スワイプ（次の画像へ）
			fadeOutInSwitchModal("next");
		} else {
			// 右スワイプ（前の画像へ）
			fadeOutInSwitchModal("prev");
		}
		} else {
		// スワイプが足りない場合は元の位置に戻す
		modalContent.classList.add("reset");
		setTimeout(() => modalContent.classList.remove("reset"), 300);
	}
}
// スワイプ時アニメーション処理
function fadeOutInSwitchModal(direction) {
	// フェードアウト
	modalContent.classList.add("fade-out");
	// アニメーションが終わったら画像を切り替えてフェードイン
	setTimeout(() => {
		if(direction =="next"){
			if (currentModalIndex== allGalleryImages.length-1){
				currentModalIndex = 0;
			}else{
				currentModalIndex++;
			}
		}else{
			if (currentModalIndex ==0){
				currentModalIndex = allGalleryImages.length-1;
			}else{
				currentModalIndex--;
			}
		}
		modalImage.src = allGalleryImages[currentModalIndex].imgSrc;
		modalLink.href = allGalleryImages[currentModalIndex].url;
		modalLink.innerHTML = allGalleryImages[currentModalIndex].title + "<br><br>記事を見る";
		// フェードイン
		modalContent.classList.remove("fade-out");
		modalContent.classList.add("fade-in");
		// 一定時間後にフェードインのクラスを削除（次の切り替えのため）
		setTimeout(() => {
			modalContent.classList.remove("fade-in");
		}, 300);
	}, 300); // フェードアウト時間と合わせる
}

// モーダルを閉じる
function closeModal() {
	modal.classList.add("fade-out");
	// 一定時間後にフェードインのクラスを削除（次の切り替えのため）
	setTimeout(() => {
		modal.classList.remove("fade-out");
		modal.classList.remove("show");
	}, 300);
}


// モーダル以外の場所をクリックしたら閉じる
window.addEventListener("click", (e) => {
	if (e.target === modal) {
		closeModal();
	}
});


