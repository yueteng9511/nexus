---
title: Stack
description: 後進先出（LIFO）的資料結構，只能從頂端放入與取出，是函式呼叫與括號配對的基礎。
category: data-structures
keywords: [堆疊, LIFO, last in first out, 後進先出, push, pop, std::stack, call stack, 括號配對]
difficulty: beginner
related: [array, linked-list, queue]
publishedAt: 2026-11-05T22:27:00+08:00
---

## Overview

**Stack**（堆疊）是一種**後進先出**（LIFO, Last In First Out）的資料結構：最後放進去的元素，會最先被拿出來。

它只開放一端（稱為**頂端**，top）讓你操作：

| 操作 | 作用 | 時間 |
|---|---|---|
| `push(x)` | 把 x 放到頂端 | O(1) |
| `pop()` | 移除頂端元素 | O(1) |
| `top()` | 查看頂端元素（不移除） | O(1) |
| `empty()` | 是否為空 | O(1) |

限制只能操作頂端，看起來是一種缺點，但正是這個限制讓它**簡單、快速、不容易出錯**。很多問題的本質就是「最近發生的事要最先處理」，這時 Stack 就是最自然的工具。例如函式呼叫、復原（undo）、括號配對、深度優先搜尋（DFS）。

## Intuition

想像餐廳裡**一疊盤子**：

- 洗好的盤子放在最上面（push）。
- 要用盤子時，從最上面拿（pop）。
- 你不會從中間抽一個盤子出來，那樣整疊會倒。

生活中的其他例子：

- **瀏覽器的「上一頁」**：每開一個新頁面就 push，按上一頁就 pop，回到最近看過的那頁。
- **編輯器的 Ctrl+Z**：每個操作 push 進「復原堆疊」，按 Ctrl+Z 就 pop 出最近的一個操作，把它撤銷。

## How It Works

### 用陣列實作

最常見的做法是用動態陣列（`std::vector`），把**尾端當作頂端**：

- `push` = `push_back`，`pop` = `pop_back`，`top` = `back()`。
- 這些都在尾端操作，**不需要搬移任何元素**，所以都是 O(1)（`push_back` 是攤銷 O(1)）。

注意不能把**開頭**當頂端，因為在 `vector` 開頭插入、刪除要搬移所有元素，是 O(n)。

也可以用 Linked List 實作，把**串列開頭當頂端**：`push` 是在開頭插入節點，`pop` 是刪除第一個節點，都是 O(1)。

### 範例：括號配對

判斷一串括號 `{[()]}` 是否正確配對，是 Stack 的經典應用：

1. 遇到**左括號**：push 進堆疊，等待之後的右括號來配對。
2. 遇到**右括號**：它必須和「**最近一個還沒配對的左括號**」配對，也就是堆疊頂端。如果堆疊是空的，或頂端的種類不符，就是錯誤。配對成功就 pop。
3. 全部讀完後，堆疊必須是**空的**；還有剩下的左括號，代表它們沒被關閉。

追蹤 `{[()]}` 的過程：

| 讀到 | 動作 | 堆疊（左邊是底部） |
|---|---|---|
| `{` | push | `{` |
| `[` | push | `{ [` |
| `(` | push | `{ [ (` |
| `)` | 與頂端 `(` 配對，pop | `{ [` |
| `]` | 與頂端 `[` 配對，pop | `{` |
| `}` | 與頂端 `{` 配對，pop | 空 |

讀完後堆疊為空，所以配對正確。換成 `([)]`：讀到 `)` 時頂端是 `[`，種類不符，立刻判定錯誤。

這個問題之所以適合 Stack，是因為括號是**巢狀**的：越晚打開的括號，必須越早關閉。這正是後進先出。

### 呼叫堆疊（Call Stack）

程式執行時，每呼叫一個函式，系統就把這個函式的區域變數、參數、返回位址放進一塊叫 **stack frame** 的空間，push 到**呼叫堆疊**上；函式 return 時，就把它的 frame pop 掉，回到呼叫者。

```cpp
int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);   // fact(3) → fact(2) → fact(1)，依序 push；return 時依序 pop
}
```

這就是為什麼**遞迴太深會讓程式崩潰**：每一層遞迴都佔一個 frame，而呼叫堆疊的大小有限（Linux 預設約 8 MB，Windows 預設約 1 MB）。用完就會發生 **stack overflow**。

在組合語言中，`push`、`pop`、`call`、`ret` 這些指令直接操作 CPU 的堆疊指標暫存器（x86 的 `esp` / `rsp`），可以看到這個機制在硬體層的樣子。

## Implementation

### 用 `vector` 實作 Stack

```cpp
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

class Stack {
public:
    void push(int v) { data.push_back(v); }  // 放到尾端 = 放到頂端

    void pop() {
        if (empty()) throw underflow_error("pop on empty stack");
        data.pop_back();
    }

    int top() const {
        if (empty()) throw underflow_error("top on empty stack");
        return data.back();
    }

    bool empty() const { return data.empty(); }
    size_t size() const { return data.size(); }

private:
    vector<int> data;  // 尾端當作頂端：push / pop 都在尾端，O(1)
};

int main() {
    Stack s;
    for (int v : {1, 2, 3}) {
        s.push(v);
        cout << "push " << v << " -> top = " << s.top() << '\n';
    }
    while (!s.empty()) {
        cout << "pop " << s.top() << '\n';
        s.pop();
    }

    try {
        s.pop();
    } catch (const underflow_error& e) {
        cout << "error: " << e.what() << '\n';
    }
}
```

```text
push 1 -> top = 1
push 2 -> top = 2
push 3 -> top = 3
pop 3
pop 2
pop 1
error: pop on empty stack
```

放入的順序是 1、2、3，取出的順序是 3、2、1：順序剛好反過來，這就是 LIFO。

### 括號配對（使用 `std::stack`）

```cpp
#include <iostream>
#include <stack>
#include <string>
using namespace std;

// 檢查括號是否成對，而且正確巢狀
bool isBalanced(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);  // 左括號：先記下來，等待配對
        } else if (c == ')' || c == ']' || c == '}') {
            if (st.empty()) return false;  // 右括號比左括號多
            char open = st.top();
            st.pop();
            if ((c == ')' && open != '(') ||
                (c == ']' && open != '[') ||
                (c == '}' && open != '{')) {
                return false;  // 種類不符，例如 "(]"
            }
        }
        // 其他字元直接忽略
    }
    return st.empty();  // 還有剩下的左括號 → 沒有被關閉
}

int main() {
    const string tests[] = {"{[()()]}", "([)]", "((", "a[b]{c(d)e}f", ""};
    for (const string& t : tests) {
        cout << '"' << t << "\" -> " << (isBalanced(t) ? "balanced" : "not balanced") << '\n';
    }
}
```

```text
"{[()()]}" -> balanced
"([)]" -> not balanced
"((" -> not balanced
"a[b]{c(d)e}f" -> balanced
"" -> balanced
```

`std::stack` 是一個**容器轉接器**（container adaptor）：它本身不存資料，而是包住另一個容器（預設是 `std::deque`），只對外開放 `push`、`pop`、`top` 等操作。

## Complexity

| 操作 | `vector` 實作 | Linked List 實作 |
|---|---|---|
| `push` | 攤銷 O(1) | O(1) |
| `pop` | O(1) | O(1) |
| `top` | O(1) | O(1) |
| `empty` / `size` | O(1) | O(1) |
| 搜尋任意元素 | O(n) | O(n) |

**空間複雜度**：O(n)。

括號配對演算法：每個字元最多 push、pop 各一次，時間 O(n)；最壞情況（全是左括號）堆疊存 n 個元素，空間 O(n)。

## Common Mistakes

**1. 對空的 `std::stack` 呼叫 `top()` 或 `pop()`**

`std::stack` **不會**丟出例外，對空堆疊呼叫 `top()` 或 `pop()` 是**未定義行為**，程式可能讀到垃圾值或直接崩潰。一定要先檢查 `empty()`。

**2. 以為 `pop()` 會回傳被移除的元素**

`std::stack::pop()` 的回傳型別是 `void`。要先用 `top()` 取值，再 `pop()`：

```cpp
int x = st.top();
st.pop();
```

**3. 括號配對忘記最後檢查堆疊是否為空**

`"(("` 從頭到尾都沒有發生不符，但讀完時堆疊還剩兩個左括號，所以是錯誤的。少了最後的 `return st.empty()`，就會誤判成正確。

**4. 遞迴太深造成 stack overflow**

遞迴深度和輸入大小成正比時（例如對 10^6 個節點的串列遞迴），很容易超過呼叫堆疊的上限。可以改寫成迴圈，或自己用 `std::stack` 模擬遞迴。

**5. 搞混「資料結構的 Stack」和「記憶體的 stack / heap」**

- **資料結構** Stack：一種 LIFO 的抽象資料型別。
- **記憶體區段** stack：存放區域變數與 stack frame 的區域，運作方式正好是 LIFO，所以以此命名。
- **記憶體區段** heap：`new` / `malloc` 配置的區域。它和資料結構中的 Heap（優先佇列）**沒有關係**，只是剛好同名。

**6. 把 `vector` 的開頭當作頂端**

`v.insert(v.begin(), x)` 和 `v.erase(v.begin())` 都要搬移所有元素，是 O(n)。用 `vector` 實作時，頂端一定要放在**尾端**。
