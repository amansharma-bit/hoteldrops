REPLACE this entire doScan function in frontend/src/app/page.tsx:

  async function doScan() {
    if (!file) return;
    setScanning(true);
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const formData = new FormData();
      formData.append('voucher', file);
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/extract', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      clearInterval(interval);
      if (!json.success && json.blocked) {
        setBlockInfo({ reason: json.blockReason, message: json.message });
        if (json.data) setExtracted({ ...emptyExtracted(), ...json.data });
        else setExtracted(emptyExtracted());
        setUploadStep('blocked');
        setScanning(false);
        return;
      }
      const data = json.data;
      setExtracted({ ...emptyExtracted(), ...data });
      setWarnings(json.warnings || {});
      if (data.cancellation_policy === 'non-refundable') {
        setBlockInfo({ reason: 'non_refundable' });
        setUploadStep('blocked');
      } else {
        setUploadStep(2);
      }
    } catch {
      clearInterval(interval);
      setExtracted(emptyExtracted());
      setWarnings({});
      setBlockInfo({ reason: 'network_error', message: 'Could not reach the server. Please enter your booking details manually.' });
      setUploadStep('blocked');
    }
    setScanning(false);
  }

WITH THIS:

  async function doScan() {
    if (!file) return;
    setScanning(true);
    const msgs = ['Reading your voucher…', 'Identifying hotel & dates…', 'Extracting pricing…', 'Checking cancellation policy…', 'Almost done…'];
    let i = 0; setScanMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setScanMsg(msgs[i]); }, 900);
    try {
      const formData = new FormData();
      formData.append('voucher', file);
      const res = await fetch('https://hoteldrops-production-7e5a.up.railway.app/api/voucher/extract', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      clearInterval(interval);
      setScanning(false);

      // ── NOT A HOTEL / POOR QUALITY ─────────────────────────────────────
      if (!json.success && json.blocked) {
        setBlockInfo({ reason: json.blockReason, message: json.message });
        if (json.data) setExtracted({ ...emptyExtracted(), ...json.data });
        else setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }

      const docType = json.documentType;

      // ── SEARCH RESULTS / HOTEL DETAIL — redirect to /upload page ──────
      if (docType === 'search_results' || docType === 'hotel_detail_rooms' || docType === 'hotel_detail_top') {
        sessionStorage.setItem('rebuq_extract_result', JSON.stringify(json));
        closeModal();
        router.push('/upload');
        return;
      }

      // ── CHECKOUT PAGE ─────────────────────────────────────────────────
      if (docType === 'checkout_page') {
        const data = json.data;
        setExtracted({ ...emptyExtracted(), ...data });
        setWarnings(json.warnings || {});
        setUploadStep(2);
        return;
      }

      // ── CONFIRMED VOUCHER ─────────────────────────────────────────────
      const data = json.data;
      if (!data) {
        setBlockInfo({ reason: 'parse_error', message: json.message || 'Could not read voucher.' });
        setExtracted(emptyExtracted());
        setUploadStep('blocked');
        return;
      }
      setExtracted({ ...emptyExtracted(), ...data });
      setWarnings(json.warnings || {});

      if (json.blocked && json.blockReason === 'non_refundable') {
        setBlockInfo({ reason: 'non_refundable' });
        setUploadStep('blocked');
        return;
      }
      if (json.blockReason === 'checkin_passed') {
        setBlockInfo({ reason: 'checkin_passed', message: json.message });
        setUploadStep('blocked');
        return;
      }

      setUploadStep(2);

    } catch {
      clearInterval(interval);
      setScanning(false);
      setExtracted(emptyExtracted());
      setWarnings({});
      setBlockInfo({ reason: 'network_error', message: 'Could not reach the server. Please enter your booking details manually.' });
      setUploadStep('blocked');
    }
  }
