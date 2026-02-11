(function () {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
    const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  
    const tones = ["ok", "warn", "danger"]
    const statuses = ["Open", "Closed", "Blocked", "Needs triage", "Escalated"]
  
    // Randomize metric values
    document.querySelectorAll('[data-testid="metric-value"]').forEach(el => {
      el.textContent = rand(1, 500)
    })
  
    // Randomize metric badge tones
    document.querySelectorAll('[data-testid="metric-card"] .badge').forEach(badge => {
      badge.setAttribute("data-tone", pick(tones))
    })
  
    // Randomize table rows
    const tbody = document.querySelector('[data-testid="table"] tbody')
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('[data-testid="row"]'))
  
      // Shuffle rows
      rows.sort(() => Math.random() - 0.5)
      rows.forEach(row => tbody.appendChild(row))
  
      // Randomize status badges inside rows
      rows.forEach(row => {
        const badges = row.querySelectorAll('.badge')
        badges.forEach(b => {
          if (!b.closest("td:first-child")) {
            b.textContent = pick(statuses)
            b.setAttribute("data-tone", pick(tones))
          }
        })
      })
    }
  
    // Randomly disable some buttons
    document.querySelectorAll('[data-testid="btn"]').forEach(btn => {
      if (Math.random() > 0.8) btn.disabled = true
    })
  
    // Simulated loading state on page
    const page = document.querySelector('[data-testid="page-dashboard"]')
    if (page) {
      page.classList.add("is-loading")
      setTimeout(() => page.classList.remove("is-loading"), rand(300, 900))
    }
  
    // Fake pagination
    const nextBtn = Array.from(document.querySelectorAll('[data-testid="btn"]'))
      .find(b => b.textContent.trim() === "Next")
  
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const rows = document.querySelectorAll('[data-testid="row"]')
        rows.forEach(r => r.style.display = Math.random() > 0.5 ? "" : "none")
      })
    }
  
  })()
  