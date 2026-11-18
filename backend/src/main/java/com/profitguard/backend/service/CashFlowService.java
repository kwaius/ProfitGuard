package com.profitguard.backend.service;

import com.profitguard.backend.dto.CashFlowSettingsDTO;
import com.profitguard.backend.dto.ScheduledCashFlowDTO;
import com.profitguard.backend.dto.TransactionDTO;
import com.profitguard.backend.exception.ResourceNotFoundException;
import com.profitguard.backend.model.ConfiguracaoFluxoCaixa;
import com.profitguard.backend.model.FluxoCaixaPrevisto;
import com.profitguard.backend.model.TransacaoFinanceira;
import com.profitguard.backend.repository.ConfiguracaoFluxoCaixaRepository;
import com.profitguard.backend.repository.FluxoCaixaPrevistoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class CashFlowService {

    @Autowired
    private ConfiguracaoFluxoCaixaRepository configuracaoRepository;

    @Autowired
    private FluxoCaixaPrevistoRepository previstoRepository;

    @Autowired
    private FinanceiroService financeiroService;

    // ---------- configurações (saldo informado + reserva mínima)

    public CashFlowSettingsDTO obterConfiguracao() {
        return paraDto(configuracaoRepository.findById(ConfiguracaoFluxoCaixa.ID_UNICO)
                .orElseGet(ConfiguracaoFluxoCaixa::new));
    }

    @Transactional
    public CashFlowSettingsDTO salvarConfiguracao(CashFlowSettingsDTO dto) {
        ConfiguracaoFluxoCaixa config = configuracaoRepository.findById(ConfiguracaoFluxoCaixa.ID_UNICO)
                .orElseGet(ConfiguracaoFluxoCaixa::new);
        config.setSaldoInicial(dto.startingBalance());
        config.setReservaMinima(dto.reserveAmount() != null ? dto.reserveAmount() : BigDecimal.ZERO);
        return paraDto(configuracaoRepository.save(config));
    }

    private CashFlowSettingsDTO paraDto(ConfiguracaoFluxoCaixa c) {
        return new CashFlowSettingsDTO(
                c.getSaldoInicial(),
                c.getReservaMinima() != null ? c.getReservaMinima() : BigDecimal.ZERO);
    }

    // ---------- lançamentos previstos

    public List<ScheduledCashFlowDTO> listarPrevistos() {
        return previstoRepository.findAllByOrderByDataVencimentoAscIdAsc().stream()
                .map(ScheduledCashFlowDTO::fromEntity).toList();
    }

    public ScheduledCashFlowDTO criarPrevisto(ScheduledCashFlowDTO dto) {
        FluxoCaixaPrevisto e = new FluxoCaixaPrevisto();
        preencher(e, dto);
        return ScheduledCashFlowDTO.fromEntity(previstoRepository.save(e));
    }

    public ScheduledCashFlowDTO atualizarPrevisto(Long id, ScheduledCashFlowDTO dto) {
        FluxoCaixaPrevisto e = buscar(id);
        preencher(e, dto);
        return ScheduledCashFlowDTO.fromEntity(previstoRepository.save(e));
    }

    public void excluirPrevisto(Long id) {
        previstoRepository.delete(buscar(id));
    }

    /** Dá baixa: vira uma transação realizada (data de hoje) e o previsto some da lista. */
    @Transactional
    public TransactionDTO realizarPrevisto(Long id) {
        FluxoCaixaPrevisto previsto = buscar(id);
        boolean entrada = TransactionDTO.tipoParaFront(previsto.getTipo()).equals("income");

        TransacaoFinanceira transacao = new TransacaoFinanceira();
        transacao.setDescricao(previsto.getDescricao());
        transacao.setCategoria(entrada ? "Recebimento previsto" : "Conta prevista");
        transacao.setDataTransacao(LocalDate.now().atStartOfDay());
        transacao.setValor(previsto.getValor());
        transacao.setTipo(previsto.getTipo());

        TransacaoFinanceira salva = financeiroService.salvar(transacao);
        previstoRepository.delete(previsto);
        return TransactionDTO.fromEntity(salva);
    }

    private FluxoCaixaPrevisto buscar(Long id) {
        return previstoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento previsto não encontrado: id=" + id));
    }

    private void preencher(FluxoCaixaPrevisto e, ScheduledCashFlowDTO dto) {
        e.setDescricao(dto.description().trim());
        e.setValor(dto.amount());
        e.setTipo(TransactionDTO.tipoDoFront(dto.type()));
        e.setDataVencimento(dto.dueDate());
    }
}
