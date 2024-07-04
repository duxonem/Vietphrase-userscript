# Vietphrase userscript
Đây là Userscript để convert VietPhrase ngay trên trình duyệt thông qua các addon/extension như Tampermonkey, Greasemonkey, Firemonkey...

### Cài đặt
Sau khi trình duyệt đã cài extension Tampermonkey/Firemonkey... bấm vào link dưới đây
https://greasyfork.org/vi/scripts/498499-vietphrase-converter

#### Sau khi chạy thành công, sẽ hiện 1 nút ở góc trên bên phải.

Chọn nút ↓ để tải các từ điển lên, ít nhất phải có Phiên Âm và Vietphrase. Chọn các Option khác phù hợp với bạn. Hiện tại với Vietphrase nhiều nghĩa thì các nghĩa để cách bắng dấu ";", bạn thay bằng dấu khác theo cách đặt của bạn như dấu '/'...

![1](https://github.com/duxonem/Vietphrase-userscript/assets/128269506/6861c924-0584-43f3-a3ff-2b53c4b44bcc)

#### Sau khi mở trang tiếng Trung, muốn chuyển qua dạng Vietphrase đọc đươc thì nhấn phần nút bên trái, nhấn bên phải để chạy kiểu khác. Kiểu bên trái sẽ nhanh hơn nhưng có thể phá vỡ chức năng trang web khiến 1 số nút hoặc chức năng không chạy được. Kiểu bên phải sẽ convert theo từng element sẽ lâu hơn và do thay đổi nội dung (chữ tàu qua việt) nên có thể sẽ kích hoạt 1 số chức năng của trang web.
![2](https://github.com/duxonem/Vietphrase-userscript/assets/128269506/46434eec-8e3d-4a64-8564-6b206db45d2e)

### Mục tự động để script chạy tự động ở các host do bạn chọn mà không cần bấm nút để convert. Trong đó:
- Font là để thay thế font mặc định của trang web do các font chữ trung khi hiện tiếng Việt có thể sẽ không đẹp.

- các host sẽ tự động convert, bạn không cần phải bấm nút mỗi lần qua trang mới trên host đó.
- các tùy chọn trái/phải tương ứng với với việc bấm nút "Tran" bên trái hoặc "slate" bên phải.

- cuối cùng là các host sẽ không chạy hoặc hiện nút do không cần convert, ví dụ các trang có đuôi ".vn" chắc chắn không cần do là tiếng Việt.
![3](https://greasyfork.s3.us-east-2.amazonaws.com/tveisyhbs4rd3nwd1ja31ccuuvti)

### Chú ý:
Với thiết bị di dộng như điện thoại, máy tính bảng; userscript có nhúng sẵn extension Text Reflow WE (https://github.com/lilydjwg/text-reflow-we) để khi chữ bị nhỏ, phóng lớn rồi chạm 1 cái vào màn hình thì text sẽ được dàn lại, không bị tràn quá khổ mà hình giúp dễ đọc hơn.
