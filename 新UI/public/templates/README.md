# HTML Templates for LINE LIFF Group Buying App

Below are the updated HTML string templates you can directly paste into your existing `script.js` file.

## Updated `renderConsumerUI` Template

Replace the `listContainer.innerHTML = data.products.map(...)` section with:

```javascript
listContainer.innerHTML = data.products.map((p, i) => {
    cart[p.name] = 0;
    const voterList = voters[p.name] || [];
    const hasVoters = voterList.length > 0;

    return `
        <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-3">
            <div class="flex gap-3 p-3">
                <!-- Product Image - 1:1 aspect ratio -->
                <div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    <img 
                        src="${p.img}" 
                        alt="${p.name}"
                        class="absolute inset-0 h-full w-full object-cover"
                    />
                </div>

                <!-- Product Info -->
                <div class="flex flex-1 flex-col justify-between py-0.5">
                    <div>
                        <h4 class="line-clamp-2 text-[15px] font-semibold leading-tight text-gray-900">
                            ${p.name}
                        </h4>
                        <p class="mt-1 text-lg font-bold text-orange-600">
                            $${p.price}
                        </p>
                        <p class="mt-0.5 text-xs text-gray-500">
                            成團門檻：${p.moq} 份
                        </p>
                    </div>

                    <!-- Quantity Control - Large touch targets (44x44px minimum) -->
                    <div class="mt-2 flex items-center gap-3">
                        <button
                            onclick="window.changeQty(${i}, -1)"
                            class="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors active:bg-gray-100"
                            aria-label="減少數量"
                        >
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
                            </svg>
                        </button>
                        <span id="qty-box-${i}" class="min-w-[2rem] text-center text-lg font-bold text-gray-900">
                            0
                        </span>
                        <button
                            onclick="window.changeQty(${i}, 1)"
                            class="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white transition-colors active:opacity-80"
                            aria-label="增加數量"
                        >
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            ${hasVoters ? `
                <!-- Voters Accordion Toggle -->
                <button
                    onclick="window.toggleVoters(${i})"
                    class="flex w-full items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors active:bg-gray-100"
                >
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span>查看跟團者 (${voterList.length} 人)</span>
                    <svg id="chevron-${i}" class="h-4 w-4 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                <!-- Voters List (Hidden by default) -->
                <div id="voters-${i}" class="hidden border-t border-gray-200 bg-gray-50/50 px-4 py-3">
                    ${voterList.map(v => `
                        <div class="flex items-center justify-between py-1.5 text-sm">
                            <span class="text-gray-900">• ${v.name}</span>
                            <span class="font-medium text-gray-600">x${v.qty}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}).join('');
```

## Updated `renderProgress` Template

Replace the entire `renderProgress` function with:

```javascript
function renderProgress(progress) {
    const progressList = document.getElementById('progress-list');
    if (!progress || progress.length === 0) {
        progressList.innerHTML = '<p class="text-center text-sm text-gray-500">目前尚未有人表態</p>';
        return;
    }
    progressList.innerHTML = progress.map(item => {
        const prod = productsData.find(p => p.name === item.prodName);
        const moq = prod ? prod.moq : 1;
        const percent = Math.min((item.total / moq) * 100, 100).toFixed(0);
        const isComplete = item.total >= moq;
        
        return `
            <div class="space-y-2 mb-4 last:mb-0">
                <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-gray-900 truncate pr-2">
                        ${item.prodName}
                    </span>
                    <span class="flex items-center gap-1 font-semibold ${isComplete ? 'text-green-600' : 'text-gray-500'}">
                        ${isComplete ? `
                            <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        ` : ''}
                        ${item.total} / ${moq}
                    </span>
                </div>
                <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div 
                        class="h-full rounded-full transition-all duration-500 ease-out ${isComplete ? 'bg-green-600' : 'bg-blue-500'}"
                        style="width: ${percent}%"
                    ></div>
                </div>
            </div>
        `;
    }).join('');
}
```

## Updated `toggleVoters` Function

Replace the `window.toggleVoters` function with:

```javascript
window.toggleVoters = function (index) {
    const votersDiv = document.getElementById(`voters-${index}`);
    const chevron = document.getElementById(`chevron-${index}`);
    
    if (votersDiv.classList.contains('hidden')) {
        votersDiv.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        votersDiv.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
};
```

## Updated HTML Structure (index.html)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>我的團購登記</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <style>
        * {
            -webkit-tap-highlight-color: transparent;
        }
        html, body {
            overflow-x: hidden;
            touch-action: pan-y;
        }
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
    </style>
</head>
<body class="bg-gray-100 font-sans antialiased">
    <div id="app" class="min-h-screen w-full pb-32">
        <!-- Header -->
        <header class="mb-6 pt-6 text-center px-4">
            <h2 id="wave-title" class="text-xl font-semibold text-gray-900">等我一下...</h2>
            <div id="role-tag" class="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600"></div>
        </header>

        <!-- Progress Board -->
        <section id="leader-board" style="display: none;" class="mx-4 mb-6 rounded-2xl border border-gray-200 bg-white p-4">
            <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                <svg class="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
                集結中！開團還差多少？
            </h3>
            <div id="progress-list" class="grid gap-4"></div>
        </section>

        <!-- Product List -->
        <section id="product-list" class="px-4">
            <div class="flex items-center justify-center py-12 text-gray-500">
                <svg class="h-5 w-5 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在連線至後端資料庫...
            </div>
        </section>

        <!-- Footer -->
        <footer id="footer" class="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm safe-area-bottom">
            <div class="flex gap-3">
                <button id="btn-share" style="display: none;" class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-semibold text-white transition-colors active:opacity-80">
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    邀請更多人
                </button>
                <button id="btn-submit" class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-base font-semibold text-white transition-colors active:opacity-80 disabled:opacity-60">
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    跟團主登記數量
                </button>
            </div>
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

## Role Tag Update

Update the role tag styling in your JavaScript:

```javascript
// For Leader
document.getElementById('role-tag').className = 'mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800';
document.getElementById('role-tag').innerHTML = `
    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
    <span>您是本團負責人</span>
`;

// For Member
document.getElementById('role-tag').className = 'mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600';
document.getElementById('role-tag').innerHTML = `
    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
    <span>你是團員</span>
`;
```
