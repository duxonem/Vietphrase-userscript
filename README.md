# Vietphrase userscript
Đây là Userscript để convert VietPhrase ngay trên trình duyệt thông qua các addon/extension như Tampermonkey, Greasemonkey, Firemonkey... Copy lưu lại từ 
https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24087965 và 
https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24088744.


### Cài đặt
Sau khi trình duyệt đã cài extension Tampermonkey/Firemonkey... bấm vào link dưới đây
https://github.com/duxonem/Vietphrase-userscript/raw/main/Vietphrase%20Translate.user.js


Vietphrase Translate.user.js là file userscript, trong đó phần header có 3 dòng trỏ tới các file PhienAm, Names và VietPhrase có dạng

// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/PhienAm.txt.js   
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/Names.txt   
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/VietPhrase.txt.js  

Các file trên lần lượt là PhienAm, VietPhrase, Names (chú ý đúng chữ Hoa và chữ thường) là các file có dạng

const Names = {  
"TentiengTau1":"TentiengAnh1",  
"TentiengTau2":"TentiengAnh2",  
"TentiengTau3":"TentiengAnh3"};  

const VietPhrase = {  
"殺死":"giết chết",  
"毁了":"hủy",  
"毁掉":"hủy diệt",  
"毅然":"dứt khoát"};   

const PhienAm = {  
"第":"đệ",  
"九":"cửu",  
"章":"chương"};   

File PhienAm đã đầy đủ không cần thay thế. VietPhrase và Names có thể thay thế theo nhu cầu.  

Vì các file từ điển trên nhúng dưới dạng code js (@require), để an toàn bạn nên dùng file của chính mình tự up lên 1 host nào đó; không sợ bị người khác thay bằng code js mà bạn không biết.

Do định dạng nó khác file từ điển hay dùng của Quick Translation nên có script convertDict (convertDict.js dùng với dòng lệnh nodejs, convertDict.py dùng với python từ dòng lệnh hoặc convert.html với trình duyệt). Sau khi có file từ diển đúng định dạng, tải lên 1 dịch vụ cho phép truy cập raw như pastebin hoặc github này. Pastebin bị hạn chế kích thước (500KB). 

Sau khi chạy thành công, sẽ hiện 1 nút ở góc trên bên phải. Sau khi mở trang tiếng Trung, muốn chuyển qua dạng Vietphrase đọc đươc thì nhấn phần nút bên trái, nhấn bên phải để chạy kiểu khác.  

Đây là hình ví dụ trên PC
![image](https://user-images.githubusercontent.com/128269506/226879528-99b43031-a266-4e19-b2cf-c437e5c25d57.png)

Đây là hình ví dụ trên Firefox Nightly Android
![VP Trans userscript](https://user-images.githubusercontent.com/128269506/227080869-048d5a9a-b2d2-4e79-8ea5-a200db91a32c.jpg)
