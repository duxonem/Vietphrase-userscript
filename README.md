# aaaaaaa
Copy lưu lại từ 
https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24087965 và 

https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24088744.

Đây là Userscript để convert VietPhrase ngay trên trình duyệt thông qua các addon/extension như Tampermonkey, Greasemonkey, Firemonkey... và một số con khỉ khác có cùng chức năng.

Vietphrase Translate.user.js là file userscript, trong đó phần header có 3 dòng trỏ tới các file PhienAm, Names và VietPhrase có dạng

// @require      https://pastebin.com/raw/rSq6D6V9

// @require      https://pastebin.com/raw/7euNQrc3

// @require      https://pastebin.com/raw/cr28ykW5

Các file trên lần lượt là PhienAm, Vietphrase, Names là các file có dạng

const Names = {
"TentiengTau1":"TentiengAnh1",

"TentiengTau2":"TentiengAnh2",

"TentiengTau3":"TentiengAnh3"};

File PhienAm (dòng đầu tiên, https://pastebin.com/raw/rSq6D6V9) đã đầy đủ không cần thay thế. VietPhrase và Names có thể thay thế theo nhu cầu.

Do định dạng nó khác file từ điển hay dùng của Quick Translation nên có script convertDict (convertDict.js hoặc convertDict.py). Sau khi có file từ diển đúng định dạng, tải lên 1 dịch vụ cho phép truy cập raw như pastebin hoặc  github này. Pastebin bị hạn chế kích thước (500KB) và file lớn sẽ kêu có vi phạm. 

SAu khi chạy thành công, sẽ hiện 1 nút ở goc trên bên phải. Sau khi mở trang tiếng Trung, muốn chuyển qua dạng Vietphrase đọc đươc nthif nhấn nút trên. Đay là ví dụ trên PC
![image](https://user-images.githubusercontent.com/128269506/226879528-99b43031-a266-4e19-b2cf-c437e5c25d57.png)

Đây là ví dụ trên Firefox Nightly Android
![VP Trans userscript](https://user-images.githubusercontent.com/128269506/227080869-048d5a9a-b2d2-4e79-8ea5-a200db91a32c.jpg)
