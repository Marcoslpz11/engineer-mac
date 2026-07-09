
//　ajaxzip3 郵便番号検索
const postalButton = document.querySelector(".postal-button");
const formAddr = document.querySelector(".p-form__address");
/***********************************************
 * Method
 * ********************************************/
// 住所検索ボタン
if (postalButton) {
  postalButton.addEventListener("click", function () {
    AjaxZip3.zip2addr("郵便番号", "", "現住所", "現住所");
    AjaxZip3.onSuccess = function () {
      formAddr.classList.remove("failure");
    };
    AjaxZip3.onFailure = function () {
      formAddr.classList.add("failure");
    };
  });
}
// ファイル名取得
const formFiles = document.querySelectorAll(".p-form__file input");
const formFilesArr = Array.prototype.slice.call(formFiles); //formFilesを配列に変換
if (formFilesArr) {
  //formFilesArrの条件式
  formFilesArr.map((formFile) => {
    //mapは与えられた関数(formFile)を配列のすべての要素に対して呼び出し、その結果からなる新しい配列を生成
    formFile.addEventListener("change", (fileInput) => {
      formFile.parentNode.querySelector("span").textContent =
        fileInput.target.files[ 0 ].name;
    });
  });
}
//スラッシュ編集を行うFunction 生年月日
function toSlash(obj) {
  if (new RegExp(/^[0-9]{8}$/).test(obj.value)) {
    let str = obj.value.trim();
    let y = str.substr(0, 4);
    let m = str.substr(4, 2);
    let d = str.substr(6, 2);
    obj.value = y + "年" + m + "月" + d + "日";
  }
}

//スラッシュ編集を解除するFunction 生年月日
function offSlash(obj) {
  let reg = new RegExp("/", "g");
  let chgVal = obj.value.replace(reg, "");
  if (!isNaN(chgVal)) {
    obj.value = chgVal; //値セット
    obj.select(); //全選択
  }
}

//スラッシュ編集を行うFunction 卒業年月
function toSlash02(obj) {
  if (new RegExp(/^[0-9]{6}$/).test(obj.value)) {
    let str = obj.value.trim();
    let y = str.substr(0, 4);
    let m = str.substr(4, 2);
    obj.value = y + "年" + m + "月";
  }
}

//スラッシュ編集を解除するFunction 卒業年月
function offSlash02(obj) {
  let reg = new RegExp("/", "g");
  let chgVal = obj.value.replace(reg, "");
  if (!isNaN(chgVal)) {
    obj.value = chgVal; //値セット
    obj.select(); //全選択
  }
}

//郵便番号編集を行うFunction
function toPostFmt(obj) {
  if (obj.value.trim().length == 7 && !isNaN(obj.value)) {
    let str = obj.value.trim();
    let h = str.substr(0, 3);
    let m = str.substr(3);
    obj.value = h + "-" + m;
  }
}
//郵便番号編集を解除するFunction
function offPostFmt(obj) {
  let reg = new RegExp("-", "g");
  let chgVal = obj.value.replace(reg, "");
  if (!isNaN(chgVal)) {
    obj.value = chgVal; //値セット
    obj.select(); //全選択
  }
}

window.addEventListener("load", function () {
  let elements = document.getElementsByClassName("ymd");
  for (let i = 0; i < elements.length; i++) {
    elements[ i ].onfocus = function () {
      offSlash(this);
    };
    elements[ i ].onblur = function () {
      toSlash(this);
    };
  }

  let ym = document.getElementsByClassName("ym");
  for (let i = 0; i < ym.length; i++) {
    ym[ i ].onfocus = function () {
      offSlash02(this);
    };
    ym[ i ].onblur = function () {
      toSlash02(this);
    };
  }

  let post = document.getElementsByClassName("postcd");
  for (let i = 0; i < post.length; i++) {
    post[ i ].onfocus = function () {
      offPostFmt(this);
    };
    post[ i ].onblur = function () {
      toPostFmt(this);
    };
  }
});
