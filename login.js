document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.login-box');
  const erro = document.getElementById('login-error');
  const box = document.querySelector('.login-box');

  if (!form || !box) return;

  // Validação de login
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const usuario = document.querySelector('input[type="text"]').value.trim();
    const senha = document.querySelector('input[type="password"]').value.trim();

    const loginsPermitidos = [
      { usuario: 'hsana', senha: 'roque' },
      { usuario: 'manserv', senha: 'piber' }
    ];

    const valido = loginsPermitidos.some(credencial =>
      credencial.usuario === usuario && credencial.senha === senha
    );

    if (valido) {
      erro.textContent = '';
      window.location.href = 'controles.html';
    } else {
      erro.textContent = 'Usuário ou senha inválidos.';
      setTimeout(() => {
        erro.textContent = '';
      }, 2000);
    }
  });

  // Borda laranja dinâmica seguindo o mouse mesmo fora da box
  window.addEventListener('mousemove', e => {
    const rect = box.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    box.style.setProperty('--x', `${x}%`);
    box.style.setProperty('--y', `${y}%`);
  });
});
