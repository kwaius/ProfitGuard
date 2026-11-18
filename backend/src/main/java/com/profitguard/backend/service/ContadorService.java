package com.profitguard.backend.service;

import com.profitguard.backend.dto.AccountantDTO;
import com.profitguard.backend.exception.ResourceNotFoundException;
import com.profitguard.backend.model.Contador;
import com.profitguard.backend.repository.ContadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContadorService {

    @Autowired
    private ContadorRepository contadorRepository;

    public List<AccountantDTO> listar() {
        return contadorRepository.findAllByOrderByCriadoEmDescIdDesc().stream()
                .map(AccountantDTO::fromEntity).toList();
    }

    public AccountantDTO criar(AccountantDTO dto) {
        Contador c = new Contador();
        preencher(c, dto);
        return AccountantDTO.fromEntity(contadorRepository.save(c));
    }

    public AccountantDTO atualizar(Long id, AccountantDTO dto) {
        Contador c = buscar(id);
        preencher(c, dto);
        return AccountantDTO.fromEntity(contadorRepository.save(c));
    }

    public void excluir(Long id) {
        contadorRepository.delete(buscar(id));
    }

    private Contador buscar(Long id) {
        return contadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contador não encontrado: id=" + id));
    }

    private void preencher(Contador c, AccountantDTO dto) {
        boolean semEmail = dto.email() == null || dto.email().isBlank();
        boolean semWhatsapp = dto.whatsapp() == null || dto.whatsapp().replaceAll("\\D", "").isEmpty();
        if (semEmail && semWhatsapp) {
            // mesma regra do front: precisa de ao menos um meio de contato
            throw new IllegalArgumentException("Informe um e-mail ou WhatsApp para permitir o contato.");
        }
        c.setNome(dto.name().trim());
        c.setEscritorio(dto.company());
        c.setEspecialidade(dto.specialty());
        c.setRegiao(dto.region());
        c.setEmail(dto.email());
        c.setWhatsapp(dto.whatsapp());
        c.setObservacoes(dto.notes());
    }
}
