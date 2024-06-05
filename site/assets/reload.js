document.addEventListener('DOMContentLoaded', (event) => {
    let intervalId = setInterval(async () => {
        try {
            let response = await fetch('http://localhost:{{ port }}/__reload')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            let data = await response.text()
            if (data === "Reload true") {
                clearInterval(intervalId)
                location.reload()
            }
        } catch (error) {
            console.error('Fetch error:', error)
            clearInterval(intervalId)
        }
    }, 800)
})
