// ===== State =====
// stats[attr] = { cs: number|null, bonus: number|null }
const stats = Object.create(null);
for (const a of ATTRS) stats[a] = { cs: null, bonus: null };

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
    return cs + b;
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

        const tdB = document.createElement("td");
        tdB.style.textAlign = "right";
        const inpB = document.createElement("input");
        inpB.type = "number";
        inpB.min = "-50";
        inpB.max = "50";
        inpB.step = "1";
        inpB.placeholder = "—";
        inpB.className = "attr-input";
        inpB.value = (stats[attr].bonus === null) ? "" : String(stats[attr].bonus);
        inpB.addEventListener("change", () => {
            stats[attr].bonus = toNum(inpB.value);
            updateAll();
        });
        tdB.appendChild(inpB);

        const tdTotal = document.createElement("td");
        tdTotal.style.textAlign = "right";
        tdTotal.className = "mini-info";
        const total = getStatTotal(attr);
        tdTotal.textContent = String(total);

        row.appendChild(tdName);
        row.appendChild(tdCS);
        row.appendChild(tdB);
        row.appendChild(tdTotal);

        elAttrBody.appendChild(row);
    }

    elFilledCount.textContent = String(filled);
}

function renderPositionTable(selectedPos = null) {
    elPosBody.innerHTML = "";

    const order = ["ST", "CF", "LW/RW", "CAM", "CM", "CDM", "LM/RM", "LB/RB", "LWB/RWB", "CB", "GK"];
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
    const items = POSITION_CONFIG[pos] || [];
    const r = computePositionScore(pos);

    elBreakTitle.textContent = "Chi tiết vị trí: " + pos;
    elBreakInfo.textContent = "Tổng hệ số=" + r.sumW + " | Điểm=" + r.score.toFixed(2);

    elBreakBody.innerHTML = "";

    const rows = items.map(it => {
        const w = Number(it.weight) || 0;
        const usedCS = stats[it.attr]?.cs ?? 0;
        const usedB = stats[it.attr]?.bonus ?? 0;
        const v = usedCS + usedB;
        const contrib = w * v;
        return { attr: it.attr, w, usedCS, usedB, contrib };
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
        tdB.textContent = String(x.usedB);

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
    renderPositionTable();
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

// init
renderAttrTable();
renderPositionTable();
renderBreakdown("ST");
