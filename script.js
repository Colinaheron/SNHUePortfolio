// Custom cursor
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
});

// Cursor interactions
document.querySelectorAll('a, button, .card, .sensory-break, img').forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.border = '2px solid #0d6efd';
    });
    
    element.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.border = '2px solid #fff';
    });
});

// Scroll progress
window.addEventListener('scroll', () => {
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollProgress.style.width = `${scrollPercent}%`;
});

// Sensory break functionality
const sensoryBreakBtn = document.querySelector('.sensory-break');
let isBreakActive = false;
let breakTimer;

sensoryBreakBtn.addEventListener('click', () => {
    if (!isBreakActive) {
        startSensoryBreak();
    } else {
        endSensoryBreak();
    }
});

function startSensoryBreak() {
    isBreakActive = true;
    document.body.classList.add('focus-mode');
    sensoryBreakBtn.style.backgroundColor = '#0d6efd';
    sensoryBreakBtn.style.color = '#fff';
    
    // Set a 2-minute timer
    breakTimer = setTimeout(() => {
        endSensoryBreak();
    }, 120000); // 2 minutes
    
    // Add pulsing animation to the button
    sensoryBreakBtn.style.animation = 'pulse 2s infinite';
}

function endSensoryBreak() {
    isBreakActive = false;
    document.body.classList.remove('focus-mode');
    sensoryBreakBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    sensoryBreakBtn.style.color = '#000';
    clearTimeout(breakTimer);
    sensoryBreakBtn.style.animation = 'float 3s ease-in-out infinite';
}

// Add hover animation to cards
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angleX = (y - centerY) / 20;
        const angleY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
    });
});

// Add pulse animation to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.animation = 'pulse 1s infinite';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.animation = 'none';
    });
});

// Add keyframe animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

// Initialize modes
let focusModeEnabled = false;
let highContrastEnabled = false;

// High contrast toggle button
const highContrastBtn = document.querySelector('.high-contrast-toggle');
highContrastBtn.addEventListener('click', () => {
    highContrastEnabled = !highContrastEnabled;
    document.body.classList.toggle('high-contrast');
    highContrastBtn.style.background = highContrastEnabled ? '#0d6efd' : 'rgba(255, 255, 255, 0.9)';
    highContrastBtn.style.color = highContrastEnabled ? '#fff' : '#000';
});

// Enhanced focus handling
document.querySelectorAll('a, button, input, [tabindex="0"]').forEach(element => {
    element.addEventListener('focus', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.border = '2px solid #0d6efd';
    });
    
    element.addEventListener('blur', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.border = '2px solid #fff';
    });
});
