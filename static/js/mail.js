/**
 * Mail sending tab controller.
 */
const Mail = {
    recipients: [],
    attachments: [],

    async uploadExcel() {
        const input = document.getElementById('mailExcelFile');
        if (!input.files.length) return alert('엑셀 파일을 선택하세요.');

        const form = new FormData();
        form.append('file', input.files[0]);

        try {
            const res = await fetch('/api/mail/upload', { method: 'POST', body: form });
            const data = await res.json();
            if (data.error) return alert(data.error);

            this.recipients = data.recipients;
            this.renderRecipients();
            document.getElementById('mailUploadInfo').textContent =
                `${data.count}개 업체 메일 주소 로드 완료`;
        } catch (e) {
            alert('업로드 실패: ' + e.message);
        }
    },

    renderRecipients() {
        const tbody = document.querySelector('#mailRecipientTable tbody');
        if (!tbody) return;

        if (!this.recipients.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-3 py-4 text-center text-gray-400">엑셀 파일을 업로드하세요</td></tr>';
            return;
        }

        let html = '';
        this.recipients.forEach((r, i) => {
            html += `<tr class="border-t border-gray-100 hover:bg-blue-50">
                <td class="px-3 py-1.5 text-center">
                    <input type="checkbox" class="mail-check" data-email="${r.email}" checked>
                </td>
                <td class="px-3 py-1.5 text-center">${i + 1}</td>
                <td class="px-3 py-1.5">${r.company}</td>
                <td class="px-3 py-1.5">${r.email}</td>
            </tr>`;
        });
        tbody.innerHTML = html;

        document.getElementById('mailSelectAll').checked = true;
    },

    toggleAll(checked) {
        document.querySelectorAll('.mail-check').forEach(cb => cb.checked = checked);
    },

    async addAttachment() {
        const input = document.getElementById('mailAttachFile');
        if (!input.files.length) return;

        for (const file of input.files) {
            const form = new FormData();
            form.append('file', file);
            try {
                const res = await fetch('/api/mail/attach', { method: 'POST', body: form });
                const data = await res.json();
                if (data.error) { alert(data.error); continue; }
                this.attachments.push(data.filename);
            } catch (e) {
                alert('첨부 실패: ' + e.message);
            }
        }
        input.value = '';
        this.renderAttachments();
    },

    renderAttachments() {
        const container = document.getElementById('mailAttachList');
        if (!container) return;
        if (!this.attachments.length) {
            container.innerHTML = '<span class="text-gray-400 text-sm">첨부파일 없음</span>';
            return;
        }
        container.innerHTML = this.attachments.map((f, i) =>
            `<span class="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                ${f}
                <button class="ml-1 text-blue-500 hover:text-red-500" onclick="Mail.removeAttachment(${i})">&times;</button>
            </span>`
        ).join('');
    },

    async removeAttachment(idx) {
        this.attachments.splice(idx, 1);
        this.renderAttachments();
    },

    getSelectedEmails() {
        const checked = document.querySelectorAll('.mail-check:checked');
        return Array.from(checked).map(cb => cb.dataset.email);
    },

    async send() {
        const subject = document.getElementById('mailSubject').value.trim();
        const body = document.getElementById('mailBody').value.trim();

        if (!subject) return alert('제목을 입력하세요.');
        if (!body) return alert('본문을 입력하세요.');

        const selected = this.getSelectedEmails();
        if (!selected.length) return alert('수신자를 선택하세요.');

        if (!confirm(`${selected.length}개 업체에 메일을 발송합니다.\n계속하시겠습니까?`)) return;

        const sendBtn = document.getElementById('mailSendBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = '발송 중...';

        try {
            const res = await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, body, recipients: selected }),
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
            } else {
                let msg = `발송 완료: 성공 ${data.success}건`;
                if (data.fail > 0) {
                    msg += `, 실패 ${data.fail}건`;
                    data.errors.forEach(e => msg += `\n  - ${e.email}: ${e.error}`);
                }
                alert(msg);
                this.attachments = [];
                this.renderAttachments();
            }
        } catch (e) {
            alert('발송 실패: ' + e.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = '메일 발송';
        }
    },
};
