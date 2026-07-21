package org.esteban_portafolio.Discol;

import org.springframework.boot.SpringApplication;

public class TestDiscolApplication {

	public static void main(String[] args) {
		SpringApplication.from(DiscolApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
