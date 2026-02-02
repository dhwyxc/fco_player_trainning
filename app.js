// ===== State =====
// stats[attr] = { cs: number|null, bonus: number|null }
const stats = Object.create(null);
for (const a of ATTRS) stats[a] = { cs: null, bonus: null };

const globalValues = {
    level: 1,
    grade: 1,
    team: 0
};

let currentSelectedPos = "ST";

const GRADE_BONUS = {
    0: 0, 1: 3, 2: 4, 3: 5, 4: 7, 5: 8, 6: 10, 7: 13, 8: 18, 9: 20, 10: 22, 11: 24, 12: 27, 13: 30
};

function getLevelBonus() {
    return globalValues.level - 1;
}

function getGradeBonus() {
    return GRADE_BONUS[globalValues.grade] || 0;
}

function getTeamBonus() {
    return globalValues.team;
}

const elAttrBody = document.querySelector("#attrTable tbody");
const elPosBody = document.querySelector("#posTable tbody");
const elBreakBody = document.querySelector("#breakTable tbody");

const elFilledCount = document.getElementById("filledCount");
const elAttrCount = document.getElementById("attrCount");

const elBreakTitle = document.getElementById("breakTitle");
const elBreakInfo = document.getElementById("breakInfo");
const elPlayerName = document.getElementById("playerName");
const elPosFilter = document.getElementById("posFilter");

// Fill filter options
Object.keys(POSITION_CONFIG).forEach(pos => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = pos;
    elPosFilter.appendChild(opt);
});
elPosFilter.addEventListener("change", () => renderAttrTable());

elAttrCount.textContent = String(ATTRS.length);

function toNum(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function getStatTotal(attr) {
    const cs = stats[attr]?.cs ?? 0;
    const b = stats[attr]?.bonus ?? 0;
    const lvB = getLevelBonus();
    const grB = getGradeBonus();
    const tcB = getTeamBonus();
    return cs + b + lvB + grB + tcB;
}

function computePositionScore(pos) {
    const items = POSITION_CONFIG[pos] || [];
    let sumW = 0;
    let sum = 0;
    for (const it of items) {
        const w = Number(it.weight) || 0;
        const val = getStatTotal(it.attr);
        sumW += w;
        sum += w * val;
    }
    const score = (sumW === 0) ? 0 : (sum / sumW);
    return { score, sumW, sum };
}

function classifyScore(x) {
    if (x >= 120) return "good";
    if (x >= 105) return "warn";
    return "";
}

function renderAttrTable() {
    elAttrBody.innerHTML = "";
    let filled = 0;

    const filter = elPosFilter.value;
    let attrsToShow = ATTRS;
    if (filter !== "all") {
        const config = POSITION_CONFIG[filter] || [];
        attrsToShow = config.map(c => c.attr);
    }

    for (const attr of ATTRS) {
        // Count filled attributes regardless of filter
        if (stats[attr].cs !== null || stats[attr].bonus !== null) filled++;

        const isVisible = attrsToShow.includes(attr);
        if (!isVisible) {
            continue; // Skip rendering if not visible
        }

        const row = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.textContent = attr;

        const tdCS = document.createElement("td");
        tdCS.style.textAlign = "right";
        const inpCS = document.createElement("input");
        inpCS.type = "number";
        inpCS.min = "0";
        inpCS.max = "200";
        inpCS.step = "1";
        inpCS.placeholder = "—";
        inpCS.className = "attr-input";
        inpCS.value = (stats[attr].cs === null) ? "" : String(stats[attr].cs);
        inpCS.addEventListener("change", () => {
            stats[attr].cs = toNum(inpCS.value);
            updateAll();
        });
        tdCS.appendChild(inpCS);

        // Global Bonuses Info
        const tdLv = document.createElement("td");
        tdLv.style.textAlign = "right";
        tdLv.className = "mini-info";
        tdLv.textContent = "+" + getLevelBonus();

        const tdGr = document.createElement("td");
        tdGr.style.textAlign = "right";
        tdGr.className = "mini-info";
        tdGr.textContent = "+" + getGradeBonus();

        const tdTC = document.createElement("td");
        tdTC.style.textAlign = "right";
        tdTC.className = "mini-info";
        tdTC.textContent = "+" + getTeamBonus();

        const tdB = document.createElement("td");
        tdB.style.textAlign = "right";
        const inpB = document.createElement("input");
        inpB.type = "number";
        inpB.min = "-50";
        inpB.max = "50";
        inpB.step = "1";
        inpB.placeholder = "0";
        inpB.className = "attr-input";
        inpB.value = (stats[attr].bonus === null) ? "" : String(stats[attr].bonus);
        inpB.addEventListener("change", () => {
            stats[attr].bonus = toNum(inpB.value);
            updateAll();
        });
        tdB.appendChild(inpB);

        const tdTotal = document.createElement("td");
        tdTotal.style.textAlign = "right";
        tdTotal.style.fontWeight = "700";
        const total = getStatTotal(attr);
        tdTotal.textContent = String(total);

        row.appendChild(tdName);
        row.appendChild(tdCS);
        row.appendChild(tdLv);
        row.appendChild(tdGr);
        row.appendChild(tdTC);
        row.appendChild(tdB);
        row.appendChild(tdTotal);

        elAttrBody.appendChild(row);
    }

    elFilledCount.textContent = String(filled);
}

function renderPositionTable(selectedPos = null) {
    elPosBody.innerHTML = "";

    const order = ["ST", "CF", "LW/RW", "CAM", "CM", "CDM", "LM/RM", "LB/RB", "LWB/RWB", "CB", "SW", "GK"];
    const positions = order.filter(p => POSITION_CONFIG[p]).concat(
        Object.keys(POSITION_CONFIG).filter(p => !order.includes(p))
    );

    for (const pos of positions) {
        const r = computePositionScore(pos);

        const tr = document.createElement("tr");
        tr.className = "clickable-row";
        if (pos === selectedPos) tr.style.background = "rgba(79, 70, 229, 0.15)";

        const tdPos = document.createElement("td");
        tdPos.style.fontWeight = "600";
        tdPos.textContent = pos;

        const tdScore = document.createElement("td");
        tdScore.style.textAlign = "right";

        const badge = document.createElement("span");
        badge.className = "score-badge " + classifyScore(r.score);
        badge.textContent = r.score.toFixed(2);

        tdScore.appendChild(badge);

        tr.appendChild(tdPos);
        tr.appendChild(tdScore);

        tr.addEventListener("click", () => renderBreakdown(pos));
        elPosBody.appendChild(tr);
    }
}

function renderBreakdown(pos) {
    currentSelectedPos = pos;
    const items = POSITION_CONFIG[pos] || [];
    const r = computePositionScore(pos);

    elBreakTitle.textContent = "Chi tiết vị trí: " + pos;
    elBreakInfo.textContent = "Tổng hệ số = " + r.sumW + " | CHỉ số = " + r.score.toFixed(2);

    elBreakBody.innerHTML = "";

    const lvB = getLevelBonus();
    const grB = getGradeBonus();
    const tcB = getTeamBonus();

    const rows = items.map(it => {
        const w = Number(it.weight) || 0;
        const usedCS = stats[it.attr]?.cs ?? 0;
        const usedB = stats[it.attr]?.bonus ?? 0;
        const v = usedCS + usedB + lvB + grB + tcB;
        const contrib = w * v;
        return { attr: it.attr, w, usedCS, usedB, contrib, totalV: v };
    }).sort((a, b) => b.w - a.w);

    for (const x of rows) {
        const tr = document.createElement("tr");

        const tdA = document.createElement("td");
        tdA.textContent = x.attr;

        const tdW = document.createElement("td");
        tdW.style.textAlign = "right";
        tdW.className = "mini-info";
        tdW.textContent = String(x.w);

        const tdCS = document.createElement("td");
        tdCS.style.textAlign = "right";
        tdCS.textContent = String(x.usedCS);

        const tdB = document.createElement("td");
        tdB.style.textAlign = "right";
        tdB.className = "mini-info";
        // Show combined global + manual bonus for simplicity in breakdown or just match the main table
        const totalBonus = x.usedB + lvB + grB + tcB;
        tdB.textContent = (totalBonus >= 0 ? "+" : "") + totalBonus;

        const tdC = document.createElement("td");
        tdC.style.textAlign = "right";
        tdC.style.fontWeight = "600";
        tdC.textContent = (x.contrib).toFixed(0);

        tr.appendChild(tdA);
        tr.appendChild(tdW);
        tr.appendChild(tdCS);
        tr.appendChild(tdB);
        tr.appendChild(tdC);
        elBreakBody.appendChild(tr);
    }
    renderPositionTable(pos);
}

function updateAll() {
    renderAttrTable();
    renderBreakdown(currentSelectedPos);
}

// ===== Save/Load =====
function getStorageKey() {
    const name = (elPlayerName.value || "").trim();
    return name ? ("fco_player_stats:" + name) : null;
}

document.getElementById("btnSave").addEventListener("click", () => {
    const key = getStorageKey();
    if (!key) {
        alert("Nhập Tên cầu thủ trước khi Lưu.");
        return;
    }
    localStorage.setItem(key, JSON.stringify(stats));
    alert("Đã lưu vào localStorage.");
});

document.getElementById("btnLoad").addEventListener("click", () => {
    const key = getStorageKey();
    if (!key) {
        alert("Nhập Tên cầu thủ trước khi Tải.");
        return;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
        alert("Không tìm thấy dữ liệu đã lưu.");
        return;
    }
    const obj = JSON.parse(raw);
    for (const a of ATTRS) {
        stats[a] = obj[a] || { cs: null, bonus: null };
    }
    updateAll();
    alert("Đã tải dữ liệu.");
});

document.getElementById("btnClear").addEventListener("click", () => {
    for (const a of ATTRS) stats[a] = { cs: null, bonus: null };
    updateAll();
});

// ===== Import/Export =====
function exportJSON() {
    const out = {};
    for (const a of ATTRS) out[a] = { cs: stats[a].cs, bonus: stats[a].bonus };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "player_stats.json";
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        let obj;
        try {
            obj = JSON.parse(event.target.result);
        } catch (err) {
            alert("JSON không hợp lệ.");
            return;
        }

        for (const [k, v] of Object.entries(obj)) {
            if (!Object.prototype.hasOwnProperty.call(stats, k)) continue;
            if (v && typeof v === "object") {
                stats[k].cs = (v.cs === undefined) ? null : toNum(v.cs);
                stats[k].bonus = (v.bonus === undefined) ? null : toNum(v.bonus);
            } else {
                stats[k].cs = toNum(v);
                stats[k].bonus = null;
            }
        }
        updateAll();
        e.target.value = "";
        alert("Đã import dữ liệu thành công.");
    };
    reader.readAsText(file);
}

document.getElementById("btnExport").addEventListener("click", exportJSON);
document.getElementById("btnImport").addEventListener("click", () => {
    document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener("change", handleImportFile);

// ===== Auto Fill from Link =====
const elPlayerLink = document.getElementById("playerLink");
const btnFill = document.getElementById("btnFill");

async function fetchFromProxy(url) {
    const proxies = [
        {
            name: "AllOrigins (JSON)",
            getUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&_=${Date.now()}`,
            parse: (json) => json.contents
        },
        {
            name: "AllOrigins (Raw)",
            getUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            parse: (text) => text
        },
        {
            name: "Corsproxy.io",
            getUrl: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            parse: (text) => text
        },
        {
            name: "Codetabs Proxy",
            getUrl: (u) => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(u)}`,
            parse: (text) => text
        }
    ];

    let lastError = null;
    let is403 = false;

    for (const proxy of proxies) {
        try {
            console.log(`Trying proxy: ${proxy.name}`);
            const resp = await fetch(proxy.getUrl(url));

            if (resp.status === 403) {
                is403 = true;
                throw new Error("HTTP 403 Forbidden");
            }

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            if (proxy.name.includes("AllOrigins (JSON)")) {
                const json = await resp.json();
                return proxy.parse(json);
            } else {
                const text = await resp.text();
                return proxy.parse(text);
            }
        } catch (err) {
            console.warn(`Proxy ${proxy.name} failed:`, err);
            lastError = err;
            if (err.message.includes("403")) is403 = true;
            continue;
        }
    }

    const errorMsg = lastError ? lastError.message : "Tất cả các proxy đều thất bại";
    if (is403) {
        throw new Error("403_FORBIDDEN");
    }
    throw new Error(errorMsg);
}

async function fillFromLink() {
    const url = (elPlayerLink.value || "").trim();
    if (!url) {
        alert("Vui lòng nhập link cầu thủ từ fo4players.com");
        return;
    }

    if (!url.includes("fo4players.com")) {
        alert("Link không hợp lệ. Vui lòng sử dụng môt link chính xác từ fo4players.com");
        return;
    }

    btnFill.disabled = true;
    btnFill.textContent = "...";

    try {
        const html = await fetchFromProxy(url);

        if (!html) {
            throw new Error("Không thể tải nội dung từ link này.");
        }

        let count = 0;
        let name = "";

        // Parse Stats for fo4players.com
        const regex = /<div class="text-shadow">([^<]+)<\/div>[\s\S]*?o-val="(\d+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            const attrName = match[1].trim();
            const val = parseInt(match[2]);
            if (stats[attrName]) {
                stats[attrName].cs = val;
                stats[attrName].bonus = 0;
                count++;
            }
        }

        // Parse Player Name
        const titleMatch = html.match(/<title>([^<|-]+)/);
        if (titleMatch) {
            name = titleMatch[1].trim().split(" mùa ")[0].split(" - ")[0];
            elPlayerName.value = name;
        }

        if (count > 0) {
            updateAll();
            alert(`Đã tự động điền ${count} chỉ số cho cầu thủ ${name ? "(" + name + ")" : ""}.`);
        } else {
            alert("Không tìm thấy chỉ số nào phù hợp. Vui lòng kiểm tra lại link.");
        }

    } catch (err) {
        console.error(err);
        if (err.message === "403_FORBIDDEN") {
            alert("Lỗi: Trang web fo4players.com đang chặn các yêu cầu tự động (HTTP 403). Vui lòng thử lại sau.");
        } else {
            alert("Có lỗi xảy ra khi tải dữ liệu: " + err.message);
        }
    } finally {
        btnFill.disabled = false;
        btnFill.textContent = "Nhập Link";
    }
}

// ===== Bonus Selectors =====
function setupBonusSelector(selectorId, key) {
    const parent = document.getElementById(selectorId);
    if (!parent) return;
    const btns = parent.querySelectorAll("button");
    btns.forEach(btn => {
        btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            globalValues[key] = parseInt(btn.getAttribute("data-val"));
            updateAll();
        });
    });
}

setupBonusSelector("levelSelector", "level");
setupBonusSelector("gradeSelector", "grade");
setupBonusSelector("teamSelector", "team");

btnFill.addEventListener("click", fillFromLink);
elPlayerLink.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fillFromLink();
});

// init
renderAttrTable();
renderPositionTable();
renderBreakdown("ST");
