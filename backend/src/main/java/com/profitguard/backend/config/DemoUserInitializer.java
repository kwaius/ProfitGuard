package com.profitguard.backend.config;

import com.profitguard.backend.model.AppUser;
import com.profitguard.backend.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class DemoUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoUserInitializer.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String name;
    private final boolean enabled;

    public DemoUserInitializer(
            AppUserRepository users,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo-user.email:demo@profitguard.com}") String email,
            @Value("${app.demo-user.password:Profit@12345}") String password,
            @Value("${app.demo-user.name:Conta de Demonstração}") String name,
            @Value("${app.demo-user.enabled:true}") boolean enabled) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password;
        this.name = name;
        this.enabled = enabled;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        if (email.isBlank() || password.isBlank()) {
            throw new IllegalStateException("Defina DEMO_USER_EMAIL e DEMO_USER_PASSWORD para criar a conta inicial.");
        }
        if (users.findByEmailIgnoreCase(email).isPresent()) return;

        AppUser demo = new AppUser();
        demo.setEmail(email);
        demo.setPasswordHash(passwordEncoder.encode(password));
        demo.setName(name);
        demo.setRole("USER");
        demo.setEnabled(true);
        users.save(demo);

        log.info("Conta local de demonstração criada para {}.", email);
    }
}
