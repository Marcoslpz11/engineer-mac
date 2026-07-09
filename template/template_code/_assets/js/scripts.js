window.addEventListener("load", () => {
  body.classList.add("is-loaded");
});

/***********************************************
 * Const
 * ********************************************/
const html = document.documentElement;
const body = document.body;
const windowHeight = window.innerHeight;
//   // ハンバーガーボタン
// const hamburgerButton = document.getElementById('js-hamburgerButton');

//  // ハンバーガーメニュー
// const header = document.getElementById('js-header');
// const headerNav = document.getElementById('js-headerNav');

/***********************************************
  * Method
* ********************************************/

//  //header スクロールmvの高さ(mvHeight)以上でjs-active付与
// window.addEventListener('scroll', function () {
//   let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
//   const header = document.getElementById("js-header");
//   const mv = document.getElementById("js-mv");
//   const mvHeight = mv.clientHeight;
//   if (scrollTop < mvHeight) {
//     header.classList.remove("js-active")
//   } else {
//     header.classList.add("js-active")
//   }
// });

// // ヘッダーの高さ分MVをずらす
// function mvLowerAddMarginTop() {
//   const headerHeight = document.getElementById('js-header').clientHeight;
//   const mv = document.getElementById('js-mv');
//    if (mv) {
//         mv.style.marginTop = headerHeight + 'px';
//       } else {
//       }
// }
// window.addEventListener('load', function(){
//   mvLowerAddMarginTop();
// });
// window.addEventListener('resize', function(){
//   mvLowerAddMarginTop();
// });

// // ------------------------ ハンバーガーメニュー
// const openHeaderNav = () => {
//   hamburgerButton.addEventListener("click", () => {
//     const headerNavOpened = body.classList.contains("is-navOpen");
//     const headerHeight = document.getElementById('js-header').clientHeight;
//     const hamburgerBg = document.getElementById('js-headerNav');
//     if (headerNavOpened) {
//       body.classList.remove("is-navOpen");
//       html.style.overflow = "";
//     } else {
//       body.classList.add("is-navOpen");
//       html.style.overflow = "hidden";
//     }
//     if (hamburgerBg) {
//       hamburgerBg.style.marginTop = headerHeight + 'px';
//     } else {
//     }
//   });
// };
// if (hamburgerButton) {
//   openHeaderNav();
// }

// //ハンバーガーメニュー内をクリックすると閉じる is-navOpenを消す
// const closeHeaderNav = () => {
//   headerNav.addEventListener('click', () => {
//     const headerNavOpened = body.classList.contains('is-navOpen');
//     if (headerNavOpened) {
//       body.classList.remove('is-navOpen');
//       html.style.overflow = '';
//     }
//   });
// }
// if (headerNav) {
//   closeHeaderNav();
// }


 // inview
/**
 * @function HTMLElement.prototype.inview　HTML要素と画面の交差を判定し処理を実行する
 */
if (!HTMLElement.prototype.inview) {
  Object.defineProperty(HTMLElement.prototype, "inview", {
    configurable: true,
    enumerable: false,
    writable: true,
    /**
     * @function callbackInView  HTML要素が画面内に入った時に実行する関数
     * @function callbackOutView  HTML要素が画面から出た時に実行する関数
     */
    value: function (callbackInView, callbackOutView) {
      const options = {
        root: null,
        rootMargin: "0%", //要素が交差する手前でコールバックを呼び出したい場合はrootMarginに0%以外の値を
        threshold: [0.5], //交差領域が50%変化した時にコールバックを呼び出す
      };
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (
            e.isIntersecting &&
            Object.prototype.toString.call(callbackInView) ===
              "[object Function]"
          ) {
            callbackInView(e);
          }
          //要素が画面から出た時
          else if (
            !e.isIntersecting &&
            Object.prototype.toString.call(callbackOutView) ===
              "[object Function]"
          ) {
            callbackOutView(e);
          }
        });
      }, options);
      observer.observe(this);
    },
  });
}
window.addEventListener("load", function () {
  const item = document.querySelectorAll(".iv");
  for (let i = 0; i < item.length; i++) {
    const elem = item[i];
    //要素が画面内に入った時クラスを付与
    setTimeout(function () {
      elem.inview(function () {
        elem.classList.add("view");
      });
    }, 800);
  }
});

const item = document.querySelectorAll(".iv");
for (let i = 0; i < item.length; i++) {
  const elem = item[i];
  //要素が画面内に入った時クラスを付与
  elem.inview(function () {
    elem.classList.add("view");
  });
}

 //ページ内のimg要素サイズを取得
const myFunc = function(src){
    return new Promise(function(resolve, reject){
        const image = new Image();
        image.src = src;
        image.onload = function(){
            resolve(image);
        }
        image.onerror = function(error){
            reject(error);
        }
    });
}
const imgs = document.getElementsByTagName('img');
for (const img of imgs) {
    const src = img.getAttribute('src');
    myFunc(src)
    .then(function(res){
        if(!img.hasAttribute('width')){
            img.setAttribute('width', res.width);
        }
        if(!img.hasAttribute('height')){
            img.setAttribute('height', res.height);
        }
    })
    .catch(function(error){
        console.log(error);
    });
}