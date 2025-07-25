document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const empresa = document.getElementById('empresa').value;
  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;
  
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ empresa, usuario, senha }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(`Login bem-sucedido!\nTipo de usuário: ${data.tipo}\nNome: ${data.nome}\nEmpresa: ${data.empresa}`);
      // Aqui você pode redirecionar para a página apropriada
      // window.location.href = data.tipo === 'admin' ? '/admin.html' : '/motorista.html';
    } else {
      alert(`Erro no login: ${data.error}`);
    }
  } catch (error) {
    alert('Erro ao conectar com o servidor');
    console.error('Error:', error);
  }
});
