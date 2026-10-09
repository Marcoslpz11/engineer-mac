// ========================
// Static form -> Contact Form 7 (Multi-Step)
// ========================
(function setupCf7Converter() {
    const tab = document.getElementById("cf7Tab");
    if (!tab) return;

    // --- Paneles de pasos ---
    const step1 = document.getElementById("cf7Step1");
    const step2 = document.getElementById("cf7Step2");
    const step3 = document.getElementById("cf7Step3");
    const resultPanel = document.getElementById("cf7Result");

    // --- Paso 1 ---
    const formNameInput   = document.getElementById("cf7FormName");
    const confirmNameInput= document.getElementById("cf7ConfirmName");
    const confirmUrlInput = document.getElementById("cf7ConfirmUrl");
    const completeUrlInput= document.getElementById("cf7CompleteUrl");
    const htmlInput       = document.getElementById("cf7Html");
    const analyzeBtn      = document.getElementById("cf7AnalyzeBtn");
    const step1Status     = document.getElementById("cf7Step1Status");

    // --- Paso 2 ---
    const fieldsList = document.getElementById("cf7FieldsList");
    const back2      = document.getElementById("cf7Back2");
    const toStep3    = document.getElementById("cf7ToStep3");

    // --- Paso 3 ---
    const useDtx     = document.getElementById("cf7UseDtx");
    const dtxList    = document.getElementById("cf7DtxList");
    const back3      = document.getElementById("cf7Back3");
    const generateBtn= document.getElementById("cf7GenerateBtn");

    // --- Resultado ---
    const outMain    = document.getElementById("cf7OutMain");
    const outConfirm = document.getElementById("cf7OutConfirm");
    const outStyles  = document.getElementById("cf7OutStyles");
    const confirmBlock = document.getElementById("cf7ConfirmBlock");
    const stylesBlock  = document.getElementById("cf7StylesBlock");
    const restartBtn = document.getElementById("cf7Restart");

    const FIELD_TYPES = ["text", "email", "tel", "textarea", "radio", "checkbox", "select", "address", "file"];

    // Estilos (SCSS) necesarios para la página de confirmación / botones
    const CONFIRM_STYLES = `.p-form__button {
  position: relative !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  .wpcf7-submit,.wpcf7-previous{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
  }
}
.p-form__buttons{
  margin: 15px auto 0;
  display: flex;
  gap: 0 20px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  @include m.mq(s-t) {
    flex-direction: column;
    gap: 15px 0;
  }
  .p-form__button{
    margin: 0;
  }
}
.p-form__submit {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  opacity: 0;
  z-index: 2;
  cursor: pointer;
}
.wpcf7-spinner {
  display: none !important;
}`;

    // Estilos (SCSS) para la página de confirmación de Confirm Plus
    const CONFIRMPLUS_STYLES = `#wpcf7cpcnf {
  width: fit-content !important;
  left: 50% !important;
  transform: translateX(-50%);
  margin: 30px 0 0 0 !important;
  height: auto !important;
  position: relative !important;
  background-color: #fff!important;
  padding: 20px!important;
  border-radius: 10px!important;
  table {
    margin: 0 auto;
  }
  tr {
    margin: 10px 0;
    display: table;
    @include m.mq(s-t) {
      display: flex;
      flex-direction: column;
    }
    &:last-child {
      display: none;
    }
  }
  th {
    width: 200px;
  }
}`;

    const FILE_FILETYPES = "png|jpg|jpeg|pdf|doc|docx|txt";
    const FILE_LIMIT = "4mb";

    // --- Estado ---
    let state = {
        originalHtml: "",
        plugin: "multistep",
        fields: [],
    };

    function showStep(panel) {
        [step1, step2, step3, resultPanel].forEach(p => p.classList.add("hidden"));
        panel.classList.remove("hidden");
    }

    // ----------------------------------------------------------------
    // Análisis del HTML estático
    // ----------------------------------------------------------------
    function detectFields(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const items = Array.from(doc.querySelectorAll(".p-form__item"));
        const counters = {};
        let usedYourName = false, usedYourEmail = false;

        return items.map((item) => {
            const dt = item.querySelector(".p-form__title");
            const required = !!(dt && dt.querySelector(".p-form__required"));

            let title = "";
            if (dt) {
                const clone = dt.cloneNode(true);
                clone.querySelectorAll(".p-form__required").forEach(e => e.remove());
                title = clone.textContent.trim();
            }

            // ¿Está en el grupo de categorías? -> candidato DTX
            const isCategory = !!item.closest(".p-form__categories");

            const dd = item.querySelector(".p-form__content");
            const isAddress = !!(dd && dd.classList.contains("p-form__address"));
            let type = "text", placeholder = "", className = "", options = [];

            if (dd && isAddress) {
                type = "address";
            } else if (dd) {
                const ta = dd.querySelector("textarea");
                const sel = dd.querySelector("select");
                const radios = dd.querySelectorAll('input[type="radio"]');
                const checks = dd.querySelectorAll('input[type="checkbox"]');
                const fileInput = dd.querySelector('input[type="file"]');
                const input = dd.querySelector("input");

                if (fileInput) {
                    type = "file";
                    className = fileInput.getAttribute("class") || "";
                } else if (ta) {
                    type = "textarea";
                    placeholder = ta.getAttribute("placeholder") || "";
                    className = ta.getAttribute("class") || "";
                } else if (sel) {
                    type = "select";
                    className = sel.getAttribute("class") || "";
                    options = Array.from(sel.querySelectorAll("option"))
                        .map(o => ({ value: (o.getAttribute("value") || o.textContent).trim() }))
                        .filter(o => o.value);
                } else if (radios.length) {
                    type = "radio";
                    className = radios[0].getAttribute("class") || "";
                    options = Array.from(radios).map(r => ({ value: r.getAttribute("value") || "" }));
                } else if (checks.length) {
                    type = "checkbox";
                    className = checks[0].getAttribute("class") || "";
                    options = Array.from(checks).map(c => ({ value: c.getAttribute("value") || "" }));
                } else if (input) {
                    placeholder = input.getAttribute("placeholder") || "";
                    className = input.getAttribute("class") || "";
                    const t = (input.getAttribute("type") || "text").toLowerCase();
                    type = (t === "email" || t === "tel") ? t : "text";
                    if (/メール|mail|e-?mail/i.test(title)) type = "email";
                    else if (/電話|tel|phone/i.test(title)) type = "tel";
                }
            }

            // Nombre automático (los campos de categoría/DTX y address no consumen el contador)
            let name = "";
            if (!isCategory && type !== "address") {
                if (type === "email" && !usedYourEmail) { name = "your-email"; usedYourEmail = true; }
                else if (/名前/.test(title) && type === "text" && !usedYourName) { name = "your-name"; usedYourName = true; }
                else {
                    counters[type] = (counters[type] || 0) + 1;
                    name = `${type}-${String(counters[type]).padStart(2, "0")}`;
                }
            }

            return {
                title, required, type, name, placeholder, className, options,
                isCategory, isAddress,
                dtx: isCategory,          // por defecto DTX si está en categorías
                dtxMode: "taxonomy",      // "taxonomy" | "posttitle"
                dtxSlug: "",
            };
        });
    }

    // ----------------------------------------------------------------
    // Generación de shortcodes
    // ----------------------------------------------------------------
    function classOpt(className) {
        if (!className) return "";
        return " " + className.trim().split(/\s+/).map(c => `class:${c}`).join(" ");
    }
    function optsQuoted(options) {
        return (options || []).map(o => `"${o.value}"`).join(" ");
    }

    function shortcodeFor(f) {
        if (f.dtx) {
            const cls = classOpt(f.className);
            if (f.dtxMode === "posttitle") {
                return `[dynamic_text post-title${cls} readonly "CF7_get_post_var key='title'"]`;
            }
            const slug = f.dtxSlug.trim() || "slug";
            return `[dynamic_text ${slug}${cls} readonly "CF7_get_taxonomy taxonomy='${slug}'"]`;
        }

        const name = f.name.trim();
        const req = f.required ? "*" : "";
        const cls = classOpt(f.className);
        const ph = f.placeholder ? ` placeholder "${f.placeholder}"` : "";

        switch (f.type) {
            case "email":    return `[email${req} ${name}${cls}${ph}]`;
            case "tel":      return `[tel${req} ${name}${cls}${ph}]`;
            case "textarea": return `[textarea${req} ${name}${cls}${ph}]`;
            case "radio":    return `[radio ${name} use_label_element ${optsQuoted(f.options)}]`;
            case "checkbox": return `[checkbox${req} ${name} use_label_element ${optsQuoted(f.options)}]`;
            case "select":   return `[select${req} ${name}${cls} ${optsQuoted(f.options)}]`;
            default:         return `[text${req} ${name}${cls}${ph}]`;
        }
    }

    // Nombre definitivo de un campo (para [multiform ...] en el confirm)
    function finalName(f) {
        if (f.dtx) return f.dtxMode === "posttitle" ? "post-title" : (f.dtxSlug.trim() || "slug");
        return f.name.trim();
    }

    // Asegura que todo campo NO-DTX tenga un nombre único (p.ej. categoría sin DTX)
    function ensureNames() {
        const maxByType = {};
        state.fields.forEach(f => {
            const m = /^(.+)-(\d+)$/.exec(f.name.trim());
            if (m) maxByType[m[1]] = Math.max(maxByType[m[1]] || 0, parseInt(m[2], 10));
        });
        state.fields.forEach(f => {
            if (f.dtx || f.name.trim()) return;
            maxByType[f.type] = (maxByType[f.type] || 0) + 1;
            f.name = `${f.type}-${String(maxByType[f.type]).padStart(2, "0")}`;
        });
    }

    function syncRequired(dt, required) {
        if (!dt) return;
        const span = dt.querySelector(".p-form__required");
        if (required && !span) dt.insertAdjacentHTML("beforeend", '<span class="p-form__required">必須</span>');
        else if (!required && span) span.remove();
    }

    // Campo de dirección (郵便番号 + 住所, compatible con YubinBango)
    function buildAddress(doc, dd, dt, f, mode) {
        // Clases extra en el <dt> (c-fontB no se fuerza: se respeta si ya estaba)
        if (dt) ["title-contactform7", "for-zip", "for-addr"].forEach(c => dt.classList.add(c));

        const wrap = dd.querySelector(".wrap") || dd;
        const inputs = Array.from(dd.querySelectorAll("input"));
        if (inputs.length < 2) return; // estructura inesperada

        // Identificar el input del código postal y el de la dirección
        const zipInput = inputs.find(i =>
            /postcd|postal|zip|郵便/.test((i.getAttribute("class") || "") + (i.getAttribute("name") || ""))
        ) || inputs[0];
        const addrInput = inputs.find(i => i !== zipInput) || inputs[1];

        const req = f.required ? "*" : "";
        const zipPh = zipInput.getAttribute("placeholder") || "";
        const addrPh = addrInput.getAttribute("placeholder") || "";

        let zipSc, addrSc;
        if (mode === "main") {
            zipSc = `[text${req} zip${classOpt(zipInput.getAttribute("class") || "")} class:p-postal-code minlength:7${zipPh ? ` placeholder "${zipPh}"` : ""}]`;
            addrSc = `[text${req} addr${classOpt(addrInput.getAttribute("class") || "")} class:p-region class:p-locality class:p-street-address class:p-extended-address${addrPh ? ` placeholder "${addrPh}"` : ""}]`;
            // span de país (oculto) al inicio del .wrap, lo usa YubinBango
            if (!wrap.querySelector(".p-country-name")) {
                const span = doc.createElement("span");
                span.className = "p-country-name";
                span.setAttribute("style", "display:none;");
                span.textContent = "Japan";
                wrap.insertBefore(span, wrap.firstChild);
            }
        } else {
            zipSc = "[multiform zip]";
            addrSc = "[multiform addr]";
        }

        zipInput.replaceWith(doc.createTextNode(zipSc));
        addrInput.replaceWith(doc.createTextNode(addrSc));
    }

    // Campo de archivo (input[type=file]) -> [file ...], conservando la nota <p>
    function buildFile(doc, dd, f, mode, name) {
        const fileInput = dd.querySelector('input[type="file"]');
        if (!fileInput) return;
        const req = f.required ? "*" : "";
        let sc;
        if (mode === "main") {
            sc = `[file${req} ${name}${classOpt(fileInput.getAttribute("class") || "")} filetypes:${FILE_FILETYPES} limit:${FILE_LIMIT}]`;
        } else {
            sc = `[multiform ${name}]`;
        }
        fileInput.replaceWith(doc.createTextNode(sc));
    }

    // Genera el HTML de un form (mode: "main" | "confirm")
    function generateForm(mode) {
        const doc = new DOMParser().parseFromString(state.originalHtml, "text/html");
        const items = Array.from(doc.querySelectorAll(".p-form__item"));

        items.forEach((item, i) => {
            const f = state.fields[i];
            if (!f) return;
            const dd = item.querySelector(".p-form__content");
            const dt = item.querySelector(".p-form__title");
            syncRequired(dt, f.required);

            // Confirm Plus: cada <dt> necesita title-contactform7 for-{nombre}
            // (lo usa Confirm Plus para cambiar de página). c-fontB se respeta si ya estaba,
            // pero no se fuerza. El address ya añade sus clases en buildAddress.
            if (state.plugin === "confirmplus" && dt && f.type !== "address") {
                dt.classList.add("title-contactform7");
                const nm = finalName(f);
                if (nm) dt.classList.add(`for-${nm}`);
            }

            if (!dd) return;
            if (f.type === "address") {
                buildAddress(doc, dd, dt, f, mode);
            } else if (f.type === "file") {
                buildFile(doc, dd, f, mode, finalName(f));
            } else if (mode === "main") {
                dd.textContent = shortcodeFor(f);
            } else {
                dd.textContent = `[multiform ${finalName(f)}]`;
            }
        });

        // Botón(es)
        const buttons = Array.from(doc.querySelectorAll(".p-form__button"));
        const lastBtn = buttons[buttons.length - 1];
        if (lastBtn) {
            if (mode === "main") {
                lastBtn.textContent = lastBtn.textContent.trim() + "[submit]";
            } else {
                const wrap = doc.createElement("div");
                wrap.className = "p-form__buttons";
                wrap.innerHTML =
                    '\n<div class="p-form__button">送信[submit]</div>\n' +
                    '<div class="p-form__button">戻る[previous]</div>\n';
                lastBtn.replaceWith(wrap);
            }
        }

        let out = doc.body.innerHTML.trim();

        // Tag multistep al final
        if (state.plugin === "multistep") {
            if (mode === "main") {
                out += `\n[multistep multistep-01 first_step "${confirmUrlInput.value.trim()}"]`;
            } else {
                out += `\n[multistep multistep-02 last_step send_email "${completeUrlInput.value.trim()}"]`;
            }
        }
        return out;
    }

    // ----------------------------------------------------------------
    // Paso 2: pintar lista de campos editable
    // ----------------------------------------------------------------
    function renderFields() {
        fieldsList.innerHTML = "";
        state.fields.forEach((f, i) => {
            const row = document.createElement("div");
            row.className = "cf7-field-row";

            const typeOpts = FIELD_TYPES
                .map(t => `<option value="${t}"${t === f.type ? " selected" : ""}>${t}</option>`).join("");

            row.innerHTML = `
                <div class="cf7-field-title" title="${escapeAttr(f.title)}">${escapeHtml(f.title) || "—"}</div>
                <select class="cf7-field-type">${typeOpts}</select>
                <label class="cf7-field-req"><input type="checkbox" class="cf7-req-check"${f.required ? " checked" : ""}> 必須</label>
                <input type="text" class="cf7-field-name" value="${escapeAttr(f.name)}" placeholder="${f.isCategory ? "DTX" : "name"}">
            `;

            row.querySelector(".cf7-field-type").addEventListener("change", (e) => { f.type = e.target.value; });
            row.querySelector(".cf7-req-check").addEventListener("change", (e) => { f.required = e.target.checked; });
            row.querySelector(".cf7-field-name").addEventListener("input", (e) => { f.name = e.target.value; });

            fieldsList.appendChild(row);
        });
    }

    // ----------------------------------------------------------------
    // Paso 3: DTX
    // ----------------------------------------------------------------
    function renderDtx() {
        dtxList.innerHTML = "";
        state.fields.forEach((f, i) => {
            const row = document.createElement("div");
            row.className = "cf7-dtx-row";
            row.innerHTML = `
                <label class="cf7-dtx-main">
                    <input type="checkbox" class="cf7-dtx-check"${f.dtx ? " checked" : ""}>
                    <span>${escapeHtml(f.title) || "—"}</span>
                </label>
                <div class="cf7-dtx-opts${f.dtx ? "" : " hidden"}">
                    <label><input type="radio" name="dtxmode-${i}" value="posttitle"${f.dtxMode === "posttitle" ? " checked" : ""}> <span data-i18n="cf7.dtxPostTitle">post title</span></label>
                    <label><input type="radio" name="dtxmode-${i}" value="taxonomy"${f.dtxMode === "taxonomy" ? " checked" : ""}> <span data-i18n="cf7.dtxTaxonomy">taxonomy</span></label>
                    <input type="text" class="cf7-dtx-slug${f.dtxMode === "taxonomy" ? "" : " hidden"}" value="${escapeAttr(f.dtxSlug)}" data-i18n-placeholder="cf7.dtxSlug" placeholder="taxonomy slug">
                </div>
            `;

            const opts = row.querySelector(".cf7-dtx-opts");
            const slugInput = row.querySelector(".cf7-dtx-slug");

            row.querySelector(".cf7-dtx-check").addEventListener("change", (e) => {
                f.dtx = e.target.checked;
                opts.classList.toggle("hidden", !f.dtx);
            });
            row.querySelectorAll(`input[name="dtxmode-${i}"]`).forEach(r => {
                r.addEventListener("change", (e) => {
                    f.dtxMode = e.target.value;
                    slugInput.classList.toggle("hidden", f.dtxMode !== "taxonomy");
                });
            });
            slugInput.addEventListener("input", (e) => { f.dtxSlug = e.target.value; });

            dtxList.appendChild(row);
        });
        if (typeof applyLanguage === "function" && typeof currentLang !== "undefined") {
            applyLanguage(currentLang);
        }
    }

    // ----------------------------------------------------------------
    // Helpers de escape
    // ----------------------------------------------------------------
    function escapeHtml(s) {
        return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function escapeAttr(s) {
        return escapeHtml(s).replace(/"/g, "&quot;");
    }

    // ----------------------------------------------------------------
    // Navegación / eventos
    // ----------------------------------------------------------------
    // Mostrar/ocultar opciones de Multi-Step según el plugin
    const multistepOpts = document.getElementById("cf7MultistepOpts");
    function syncPluginUi() {
        const sel = document.querySelector('input[name="cf7Plugin"]:checked');
        state.plugin = sel ? sel.value : "multistep";
        if (multistepOpts) multistepOpts.classList.toggle("hidden", state.plugin !== "multistep");
    }
    document.querySelectorAll('input[name="cf7Plugin"]').forEach(r =>
        r.addEventListener("change", syncPluginUi));
    syncPluginUi();

    analyzeBtn.addEventListener("click", () => {
        const html = htmlInput.value.trim();
        step1Status.textContent = "";
        if (!html) { step1Status.textContent = t("cf7.errNoHtml"); return; }

        syncPluginUi();
        const fields = detectFields(html);
        if (!fields.length) { step1Status.textContent = t("cf7.errNoFields"); return; }

        state.originalHtml = html;
        state.fields = fields;
        renderFields();
        showStep(step2);
    });

    back2.addEventListener("click", () => showStep(step1));
    toStep3.addEventListener("click", () => {
        // Si hay candidatos DTX (sección de categorías), activar DTX por comodidad
        if (state.fields.some(f => f.isCategory)) useDtx.checked = true;
        dtxList.classList.toggle("hidden", !useDtx.checked);
        renderDtx();
        showStep(step3);
    });
    back3.addEventListener("click", () => showStep(step2));

    useDtx.addEventListener("change", () => {
        dtxList.classList.toggle("hidden", !useDtx.checked);
    });

    generateBtn.addEventListener("click", () => {
        // Si no se usa DTX, desmarcar todos
        if (!useDtx.checked) state.fields.forEach(f => f.dtx = false);
        ensureNames();

        outMain.value = generateForm("main");
        if (state.plugin === "multistep") {
            outConfirm.value = generateForm("confirm");
            confirmBlock.classList.remove("hidden");
            outStyles.value = CONFIRM_STYLES;
        } else {
            confirmBlock.classList.add("hidden");
            outStyles.value = CONFIRMPLUS_STYLES;
        }
        stylesBlock.classList.remove("hidden");
        showStep(resultPanel);
    });

    restartBtn.addEventListener("click", () => {
        state = { originalHtml: "", plugin: state.plugin, fields: [] };
        showStep(step1);
    });

    // Botones de copiar
    tab.querySelectorAll(".cf7-copy-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const target = document.getElementById(btn.dataset.target);
            if (!target) return;
            try {
                await navigator.clipboard.writeText(target.value);
            } catch {
                target.select();
                document.execCommand("copy");
            }
            const original = btn.textContent;
            btn.textContent = t("cf7.copied");
            setTimeout(() => { btn.textContent = original; }, 1500);
        });
    });

})();
